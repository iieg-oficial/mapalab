import json
from datetime import datetime, timezone
from typing import Dict, Optional

from app.services.geoserver_service import GeoServerService
from app.services.periodicity import get_periodicity
from app.utils.logger import Logger
from app.consts import PERIODICITY_CACHE_FILE, CACHE_EXPIRY_HOURS


class PeriodicityCacheService:

    @staticmethod
    def load_cache() -> Dict:
        if not PERIODICITY_CACHE_FILE.exists():
            Logger.warning(f"Periodicity cache file not found: {PERIODICITY_CACHE_FILE.absolute()}")
            return {}

        try:
            with open(PERIODICITY_CACHE_FILE, 'r', encoding='utf-8') as f:
                cache = json.load(f)
                Logger.info(f"Periodicity cache loaded: {len(cache.get('layers', {}))} layers")
                return cache
        except Exception as e:
            Logger.error(f"Error loading periodicity cache: {str(e)}")
            return {}

    @staticmethod
    def save_cache(cache: Dict) -> None:
        try:
            cache_path = PERIODICITY_CACHE_FILE.absolute()
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache, f, indent=4, ensure_ascii=False)
            Logger.info(f"Periodicity cache saved: {len(cache.get('layers', {}))} layers")
        except Exception as e:
            Logger.error(f"Failed to save periodicity cache: {str(e)}")
            raise

    @staticmethod
    def is_cache_expired(cache_data: Dict) -> bool:
        if not cache_data or "last_updated" not in cache_data:
            return True

        try:
            last_updated = datetime.fromisoformat(cache_data["last_updated"].replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            hours_elapsed = (now - last_updated).total_seconds() / 3600
            return hours_elapsed > CACHE_EXPIRY_HOURS
        except Exception:
            return True

    @staticmethod
    def generate_cache() -> Dict:
        Logger.info("Starting periodicity cache generation")

        cache_data = {
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "layers": {}
        }

        workspaces = GeoServerService.get_workspaces()
        exclude_workspaces = {'raster'}

        for workspace in workspaces:
            if workspace in exclude_workspaces:
                continue

            layer_names = GeoServerService.get_layers(workspace)
            Logger.info(f"Processing periodicity for {len(layer_names)} layers in {workspace}")

            for layer_name in layer_names:
                layer_key = f"{workspace}:{layer_name}"
                try:
                    wfs_url = GeoServerService.get_layer_url(
                        workspace, layer_name, cql_filter="", property_name='fecha'
                    )
                    result = get_periodicity(wfs_url)
                    periodicity = result.get("fecha")

                    if periodicity:
                        cache_data["layers"][layer_key] = periodicity
                except Exception as e:
                    Logger.error(f"Error fetching periodicity for {layer_key}: {str(e)}")

        Logger.info(f"Periodicity cache generation completed: {len(cache_data['layers'])} layers with dates")
        return cache_data

    @staticmethod
    def get_periodicity(layer_key: str) -> Optional[Dict]:
        cache = PeriodicityCacheService._get_valid_cache()
        return cache.get("layers", {}).get(layer_key)

    @staticmethod
    def _get_valid_cache() -> Dict:
        cache = PeriodicityCacheService.load_cache()

        if not cache or PeriodicityCacheService.is_cache_expired(cache):
            Logger.warning("Periodicity cache missing or expired. Generating new cache")
            cache = PeriodicityCacheService.generate_cache()
            PeriodicityCacheService.save_cache(cache)

        return cache
