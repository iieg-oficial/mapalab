import json
import urllib.request
from datetime import datetime, timezone
from typing import Dict,  Final
from pathlib import Path

from app.services.geoserver_service import GeoServerService
from app.utils.logger import Logger


class SearchCacheService:
    CACHE_FILE: Final[Path] = Path("mapalab_layers_fields_cache.json")
    CACHE_EXPIRY_HOURS: Final[int] = 24

    @staticmethod
    def load_cache() -> Dict:
        if not SearchCacheService.CACHE_FILE.exists():
            Logger.warning(f"Cache file not found: {SearchCacheService.CACHE_FILE.absolute()}")
            return {}

        try:
            with open(SearchCacheService.CACHE_FILE, 'r', encoding='utf-8') as f:
                cache = json.load(f)
                Logger.info(f"Cache loaded from {SearchCacheService.CACHE_FILE.absolute()}: {len(cache.get('layers', {}))} layers")
                return cache
        except Exception as e:
            Logger.error(f"Error loading cache: {str(e)}")
            return {}

    @staticmethod
    def save_cache(cache: Dict) -> None:
        try:
            cache_path = SearchCacheService.CACHE_FILE.absolute()

            Logger.info(f"Saving cache to: {cache_path}")

            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache, f, indent=4, ensure_ascii=False)

            file_size = cache_path.stat().st_size
            Logger.info(f"Cache saved successfully: {len(cache.get('layers', {}))} layers, {file_size} bytes")

        except Exception as e:
            Logger.error(f"Failed to save cache to {SearchCacheService.CACHE_FILE.absolute()}: {str(e)}")
            raise

    @staticmethod
    def is_cache_expired(cache_data: Dict) -> bool:
        if not cache_data or "last_updated" not in cache_data:
            return True

        try:
            last_updated = datetime.fromisoformat(cache_data["last_updated"].replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            hours_elapsed = (now - last_updated).total_seconds() / 3600
            is_expired = hours_elapsed > SearchCacheService.CACHE_EXPIRY_HOURS

            Logger.info(f"Cache age: {hours_elapsed:.1f} hours, expired: {is_expired}")
            return is_expired
        except Exception as e:
            Logger.error(f"Error checking cache expiry: {str(e)}")
            return True

    @staticmethod
    def generate_cache() -> Dict:
        Logger.info("Starting cache generation")

        cache_data = {
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "layers": {}
        }

        workspaces = GeoServerService.get_workspaces()
        Logger.info(f"Found {len(workspaces)} workspaces: {', '.join(workspaces)}")

        stats = {"total_layers": 0, "total_fields": 0}

        for workspace in workspaces:
            SearchCacheService._process_workspace(workspace, cache_data, stats)

        Logger.info("Cache generation completed.")
        Logger.info(f"Layers with filter fields: {stats['total_layers']}")
        Logger.info(f"Total filter fields: {stats['total_fields']}")

        return cache_data

    @staticmethod
    def _process_workspace(workspace: str, cache_data: Dict, stats: Dict) -> None:
        exclud_worspaces = {'raster'}
        if workspace in exclud_worspaces:
            Logger.info(f"Skipping workspace: {workspace} (raster data)")
            return
        Logger.info(f"Processing workspace: {workspace}")

        layers = GeoServerService.get_layers(workspace)
        Logger.info(f"{len(layers)} layers detected from workspace {workspace}")

        for layer in layers:
            SearchCacheService._process_layer(workspace, layer, cache_data, stats)

    @staticmethod
    def _process_layer(workspace: str, layer: str, cache_data: Dict, stats: Dict) -> None:
        layer_key = f"{workspace}:{layer}"
        try:
            filter_fields = SearchCacheService._extract_filter_fields(workspace, layer)

            if filter_fields:
                cache_data["layers"][layer_key] = {"categorical_fields": filter_fields}
                stats["total_layers"] += 1
                stats["total_fields"] += len(filter_fields)
            else:
                Logger.warning(f"No filter fields found in layer: {layer}")

        except Exception as e:
            Logger.error(f"Failed to process layer {workspace}:{layer}: {str(e)}")

    @staticmethod
    def _extract_filter_fields(workspace: str, layer: str) -> Dict:
        FILTER_KEY: str = "nombre_institucion"
        filter_fields = {}

        wfs_url = GeoServerService.get_layer_url(workspace, layer)
        wfs_url += "&maxFeatures=1"

        try:
            with urllib.request.urlopen(wfs_url) as response:
                data = json.loads(response.read().decode())

            if not data.get("features"):
                Logger.warning(f"No features found in {workspace}:{layer}")
                return {}

            properties = data["features"][0].get("properties", {})
            field_names = [name for name in properties.keys() if name.startswith(FILTER_KEY)]

            Logger.info(f"Found {len(field_names)} filter fields in {workspace}:{layer}")

            for field_name in field_names:
                field_data = SearchCacheService._process_field(workspace, layer, field_name)
                if field_data:
                    filter_fields[field_name] = field_data

        except Exception as e:
            Logger.error(f"Error extracting filter fields from {workspace}:{layer}: {str(e)}")

        return filter_fields

    @staticmethod
    def _process_field(workspace: str, layer: str, field_name: str) -> Dict | None:
        try:
            unique_values = GeoServerService.get_property_values(workspace, layer, field_name)

            if not unique_values:
                return None
            return {
                "unique_count": len(unique_values),
                "values": sorted(list(unique_values))
            }

        except Exception as e:
            Logger.error(f"{field_name}: {str(e)}")
            return None

    @staticmethod
    def get_mapalab_cache() -> Dict:
        cache = SearchCacheService.load_cache()

        if not cache or SearchCacheService.is_cache_expired(cache):
            Logger.warning("Cache missing or expired. Generating new cache")
            cache = SearchCacheService.generate_cache()
            SearchCacheService.save_cache(cache)
        else:
            Logger.info("Using existing valid cache")

        return cache
