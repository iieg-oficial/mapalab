import pandas as pd
import urllib.request
import json
import warnings
from typing import Optional
from urllib.parse import unquote, quote_plus
from functools import lru_cache
from app.utils.logger import Logger
from app.config import settings

class GeoServerService:
    @staticmethod
    @lru_cache(maxsize=32)
    def get_periodicity(wfs_url: str) -> dict:
        try:
            Logger.info(f"Obteniendo capa de GeoServer: {wfs_url}")

            with urllib.request.urlopen(wfs_url) as response:
                if response.status != 200:
                     raise Exception(f"HTTP Error: {response.status}")
                data = json.loads(response.read().decode())
            
            if not data.get("features"):
                return {"fecha": None}

            properties = [f["properties"] for f in data["features"]]
            df = pd.DataFrame(properties)
            
            fecha = {}
            
            if 'fecha' in df.columns:
                 try:
                    try:
                        series = pd.to_datetime(df['fecha'], format='%Y-%m-%d', errors='raise')
                    except (ValueError, TypeError):
                         with warnings.catch_warnings():
                            warnings.simplefilter("ignore", UserWarning)
                            series = pd.to_datetime(df['fecha'], errors='coerce')

                    if series.notna().any():
                        valid_dates = series.dropna()
                        years = valid_dates.dt.year.astype(str)
                        months = valid_dates.dt.month
                        days = valid_dates.dt.day
                        
                        temp_df = pd.DataFrame({'year': years, 'month': months, 'day': days})
                        
                        for (year, month), group in temp_df.groupby(['year', 'month']):
                            if year not in fecha:
                                fecha[year] = {}
                            
                            month_int = int(month)
                            if month_int not in fecha[year]:
                                fecha[year][month_int] = set()
                            
                            fecha[year][month_int].update(group['day'].unique())
                 except Exception:
                     pass

            final_fecha = {}
            for year, months_data in fecha.items():
                final_fecha[year] = {}
                for month, days_set in months_data.items():
                    final_fecha[year][month] = sorted([int(d) for d in days_set])

            return {
                "fecha": final_fecha if final_fecha else None,
            }

        except Exception as e:
            Logger.error(f"Error al obtener la capa de GeoServer: {str(e)}")
            raise

    @staticmethod
    def get_layer_url(workspace: str, layer: str, cql_filter: Optional[str] = None) -> str:
        base_url = (settings.GEOSERVER_URL or "").rstrip("/")

        if not base_url:
            raise ValueError("La URL base de GeoServer no está configurada")

        if not workspace or not layer:
            raise ValueError("Se deben proporcionar workspace y layer")

        url = (
            f"{base_url}/wfs"
            f"?service=WFS"
            f"&version=1.0.0"
            f"&request=GetFeature"
            f"&typeName={workspace}:{layer}"
            f"&outputFormat=application/json"
            f"&propertyName=fecha"
        )

        if cql_filter:
            url += f"&CQL_FILTER={quote_plus(cql_filter)}"

        return unquote(url)
