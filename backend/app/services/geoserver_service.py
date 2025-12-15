import pandas as pd
import urllib.request
import requests
import json
import xml.etree.ElementTree as ET
from typing import Optional, Dict, List, Set
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
            cql_filter: Optional[str] = None
        ) -> str:
        geoserver_url = (settings.GEOSERVER_URL or "").rstrip("/")

        if not geoserver_url:
            raise ValueError("La URL base de GeoServer no está configurada")

        if not workspace or not layer:
            raise ValueError("Se deben proporcionar workspace y layer")

        url = (
            f"{geoserver_url}/wfs"
            f"?service=WFS"
            f"&version=1.0.0"
            f"&request=GetFeature"
            f"&typeName={workspace}:{layer}"
            f"&outputFormat=application/json"
        )

        if cql_filter:
            url += f"&CQL_FILTER={quote_plus(cql_filter)}"

        return unquote(url)

    @staticmethod
    def get_workspaces() -> List[str]:
        geoserver_url =(settings.GEOSERVER_URL or "").rstrip("/")

        url = f"{geoserver_url}/rest/workspaces.json"
        try:
            response = requests.get(url, auth=(settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD))
            data = response.json()
            return [ws["name"] for ws in data.get("workspaces", {}).get("workspace", [])]
        except Exception as e:
            Logger.error(f"Error getting workspaces: {str(e)}")
            return []

    @staticmethod
    def get_layers(workspace: str) -> List[str]:
        geoserver_url =(settings.GEOSERVER_URL or "").rstrip("/")

        url = f"{geoserver_url}/rest/workspaces/{workspace}/layers.json"
        try:
            response = requests.get(url, auth=(settings.GEOSERVER_USER, settings.GEOSERVER_PASSWORD))
            data = response.json()
            layers = data.get("layers", {}).get("layer", [])
            if isinstance(layers, dict):
                return [layers["name"]]
            return [layer["name"] for layer in layers]
        except Exception as e:
            Logger.error(f"Error getting layers for workspace {workspace}: {str(e)}")
            return []

    @staticmethod
    def describe_feature_type(
            workspace: str,
            layer: str
        ) -> Dict[str, str]:
        geoserver_url =(settings.GEOSERVER_URL or "").rstrip("/")

        if not geoserver_url:
            raise ValueError("GeoServer URL not configured")

        url = (
                f"{geoserver_url}/wfs"
                f"?service=WFS"
                f"&version=1.1.0"
                f"&request=DescribeFeatureType"
                f"&typeName={workspace}:{layer}"
               )

        try:
            with urllib.request.urlopen(url) as response:
                xml_data = response.read().decode()

            root = ET.fromstring(xml_data)

            fields = {}
            for element in root.iter():
                if element.tag.endswith('element') and 'name' in element.attrib and 'type' in element.attrib:
                    field_name = element.attrib['name']
                    field_type = element.attrib['type']

                    if 'string' in field_type.lower():
                        fields[field_name] = 'string'
                    elif any(t in field_type.lower() for t in ['int', 'long', 'double', 'float', 'number']):
                        fields[field_name] = 'numeric'
                    elif 'geometry' in field_type.lower() or 'geom' in field_type.lower():
                        fields[field_name] = 'geometry'
                    else:
                        fields[field_name] = 'unknown'

            return fields

        except Exception as e:
            Logger.error(f"Error describing feature type for {workspace}:{layer}: {str(e)}")
            return {}

    @staticmethod
    def get_property_values(
            workspace: str,
            layer: str,
            property_name: str,
            max_features: int = 5_000
        ) -> Set[str]:
        try:
            wfs_url = GeoServerService.get_layer_url(workspace, layer)
            wfs_url += f"&propertyName={property_name}&maxFeatures={max_features}"

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
