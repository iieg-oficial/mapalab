import pandas as pd
import urllib.request
import json
from functools import lru_cache

from app.utils.logger import Logger

@lru_cache(maxsize=32)
def get_periodicity(wfs_url: str) -> dict:
    try:
        Logger.info(f"Obteniendo capa de GeoServer: {wfs_url}")

        data = _fetch_wfs_data(wfs_url)
        df = _extract_properties(data)

        if df.empty:
            return {"fecha": None}

        fecha = _build_periodicity_structure(df)
        final_fecha = _format_periodicity(fecha)

        return {"fecha": final_fecha}

    except Exception as e:
        Logger.warning(f"Error al obtener la periodicidad de la capa del GeoServer: {str(e)}")
        return {"fecha": None}


def _fetch_wfs_data(wfs_url: str) -> dict:
    with urllib.request.urlopen(wfs_url) as response:
        if response.status != 200:
            raise Exception(f"HTTP Error: {response.status}")
        return json.loads(response.read().decode())

def _extract_properties(data: dict) -> pd.DataFrame:
    if not data.get("features"):
        return pd.DataFrame()

    properties = [f["properties"] for f in data["features"]]
    return pd.DataFrame(properties)

def _parse_date_column(series: pd.Series) -> pd.DataFrame | None:
    date_series = pd.to_datetime(series, errors='coerce')

    if not date_series.notna().any():
        return None

    valid_dates = date_series.dropna()
    return pd.DataFrame({
        'year': valid_dates.dt.year.astype(str),
        'month': valid_dates.dt.month,
        'day': valid_dates.dt.day
    })

def _build_periodicity_structure(df: pd.DataFrame) -> dict:
    fecha = {}

    for col in df.columns:
        try:
            temp_df = _parse_date_column(df[col])
            if temp_df is None:
                continue

            for (year, month), group in temp_df.groupby(['year', 'month']):
                if year not in fecha:
                    fecha[year] = {}
                if month not in fecha[year]:
                    fecha[year][month] = set()

                fecha[year][month].update(group['day'].unique())

        except (ValueError, TypeError):
            continue

    return fecha


def _format_periodicity(fecha: dict) -> dict:
    final_fecha = {}
    for year, months_data in fecha.items():
        final_fecha[year] = {}
        for month, days_set in months_data.items():
            final_fecha[year][month] = sorted([int(d) for d in days_set])

    return final_fecha if final_fecha else None


