import fcntl
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional

from app.services.geoserver_service import GeoServerService
from app.services.periodicity import get_periodicity
from app.utils.logger import Logger
from app.consts import PERIODICITY_CACHE_FILE, CACHE_EXPIRY_HOURS, MAX_CONSECUTIVE_FAILURES

LOCK_FILE = Path("/tmp/periodicity_cache.lock")


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

        existing = PeriodicityCacheService.load_cache()
        existing_layers = existing.get("layers", {})

        cache_data = {
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "layers": {}
        }

        active_layers = set()
        workspaces = GeoServerService.get_workspaces()
        exclude_workspaces = {'raster'}

        for workspace in workspaces:
            if workspace in exclude_workspaces:
                continue

            layer_names = GeoServerService.get_layers(workspace)
            Logger.info(f"Processing periodicity for {len(layer_names)} layers in {workspace}")

            for layer_name in layer_names:
                layer_key = f"{workspace}:{layer_name}"
                active_layers.add(layer_key)
                previous = existing_layers.get(layer_key, {})

                try:
                    wfs_url = GeoServerService.get_layer_url(
                        workspace, layer_name, cql_filter="", property_name='fecha'
                    )
                    result = get_periodicity(wfs_url)
                    periodicity = result.get("fecha")

                    if periodicity:
                        cache_data["layers"][layer_key] = {
                            "periodicity": periodicity,
                            "consecutive_failures": 0
                        }
                    elif previous.get("periodicity"):
                        cache_data["layers"][layer_key] = {
                            "periodicity": previous["periodicity"],
                            "consecutive_failures": previous.get("consecutive_failures", 0)
                        }
                except Exception as e:
                    Logger.error(f"Error fetching periodicity for {layer_key}: {str(e)}")
                    failures = previous.get("consecutive_failures", 0) + 1

                    if failures < MAX_CONSECUTIVE_FAILURES and previous.get("periodicity"):
                        cache_data["layers"][layer_key] = {
                            "periodicity": previous["periodicity"],
                            "consecutive_failures": failures
                        }
                        Logger.warning(f"Keeping cached periodicity for {layer_key} (failure {failures}/{MAX_CONSECUTIVE_FAILURES})")
                    elif previous.get("periodicity"):
                        Logger.warning(f"Removing periodicity for {layer_key} after {failures} consecutive failures")

        for layer_key, data in existing_layers.items():
            if layer_key not in active_layers and data.get("periodicity"):
                failures = data.get("consecutive_failures", 0) + 1
                if failures < MAX_CONSECUTIVE_FAILURES:
                    cache_data["layers"][layer_key] = {
                        "periodicity": data["periodicity"],
                        "consecutive_failures": failures
                    }
                    Logger.warning(f"Layer {layer_key} not found in GeoServer (failure {failures}/{MAX_CONSECUTIVE_FAILURES})")
                else:
                    Logger.warning(f"Removing {layer_key} from cache after {failures} consecutive failures")

        Logger.info(f"Periodicity cache generation completed: {len(cache_data['layers'])} layers with dates")
        return cache_data

    @staticmethod
    def get_periodicity(layer_key: str) -> Optional[Dict]:
        cache = PeriodicityCacheService._get_valid_cache()
        layer_data = cache.get("layers", {}).get(layer_key)
        if isinstance(layer_data, dict) and "periodicity" in layer_data:
            return layer_data["periodicity"]
        return layer_data

    @staticmethod
    def _get_valid_cache() -> Dict:
        cache = PeriodicityCacheService.load_cache()

        if not cache or PeriodicityCacheService.is_cache_expired(cache):
            lock_fd = open(LOCK_FILE, 'w')
            acquired = False
            try:
                fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                acquired = True
            except OSError:
                Logger.info("Cache generation already in progress in another worker, returning stale cache")
                lock_fd.close()
                return cache or {}

            if acquired:
                try:
                    cache = PeriodicityCacheService.load_cache()
                    if cache and not PeriodicityCacheService.is_cache_expired(cache):
                        return cache

                    Logger.warning("Periodicity cache missing or expired. Generating new cache")
                    cache = PeriodicityCacheService.generate_cache()
                    PeriodicityCacheService.save_cache(cache)
                finally:
                    fcntl.flock(lock_fd, fcntl.LOCK_UN)
                    lock_fd.close()

        return cache
