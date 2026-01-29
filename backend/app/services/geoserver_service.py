import pandas as pd
import urllib.request
import requests
import json
from typing import Optional, List, Set
from urllib.parse import quote_plus
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

            for col in df.columns:
                try:
                    series = pd.to_datetime(df[col], errors='coerce')

                    if series.notna().any():
                        valid_dates = series.dropna()
                        years = valid_dates.dt.year.astype(str)
                        months = valid_dates.dt.month
                        days = valid_dates.dt.day

                        temp_df = pd.DataFrame({'year': years, 'month': months, 'day': days})

                        for (year, month), group in temp_df.groupby(['year', 'month']):
                            if year not in fecha:
                                fecha[year] = {}
                            if month not in fecha[year]:
                                fecha[year][month] = set()

                            fecha[year][month].update(group['day'].unique())

                except (ValueError, TypeError):
                    continue

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
    def get_layer_url(
            workspace: str,
            layer: str,
            cql_filter: Optional[str] = None,
            property_name: Optional[str] = None
        ) -> str:

        if not settings.GEOSERVER_URL:
            raise ValueError("La URL base de GeoServer no está configurada")

        if not workspace or not layer:
            raise ValueError("Se deben proporcionar workspace y layer")

        url = (
            f"{settings.GEOSERVER_URL}/wfs"
            f"?service=WFS"
            f"&version=1.0.0"
            f"&request=GetFeature"
            f"&typeName={workspace}:{layer}"
            f"&outputFormat=application/json"
        )

        if property_name:
            url += f"&propertyName={property_name}"

        if cql_filter:
            url += f"&CQL_FILTER={quote_plus(cql_filter)}"

        return url

    @staticmethod
    def get_workspaces() -> List[str]:
        url = f"{settings.GEOSERVER_URL}/rest/workspaces.json"
        try:
            data = GeoServerService._request_auth_geoserver(url)
            return [ws["name"] for ws in data.get("workspaces", {}).get("workspace", [])]
        except Exception as e:
            Logger.error(f"Error getting workspaces: {str(e)}")
            return []

    @staticmethod
    def get_layers(workspace: str) -> List[str]:
        url = f"{settings.GEOSERVER_URL}/rest/workspaces/{workspace}/layers.json"
        try:
            data = GeoServerService._request_auth_geoserver(url)
            layers = data.get("layers", {}).get("layer", [])
            if isinstance(layers, dict):
                return [layers["name"]]
            return [layer["name"] for layer in layers]
        except Exception as e:
            Logger.error(f"Error getting layers for workspace {workspace}: {str(e)}")
            return []

    @staticmethod
    def get_property_values(
            workspace: str,
            layer: str,
            property_name: str,
        ) -> Set[str]:
        try:
            wfs_url = GeoServerService.get_layer_url(workspace, layer)
            wfs_url += f"&propertyName={property_name}"


            with urllib.request.urlopen(wfs_url) as response:
                data = json.loads(response.read().decode())

            values = set()
            features = data.get("features", [])

            for feature in features:
                properties = feature.get("properties", {})
                value = properties.get(property_name)

                if value is not None and str(value).strip():
                    values.add(str(value).strip())

            return values

        except Exception as e:
            Logger.error(f"Error getting property values for {workspace}:{layer}.{property_name}: {str(e)}")
            return set()

    @staticmethod
    def _request_auth_geoserver(url: str):
        response = requests.get(url, auth=(settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD))
        return response.json()
