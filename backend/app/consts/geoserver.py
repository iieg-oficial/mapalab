from typing import Final
from pathlib import Path


FILTER_KEY: Final[str] = "filter_"

CACHE_FILE: Final[Path] = Path("mapalab_layers_fields_cache.json")
PERIODICITY_CACHE_FILE: Final[Path] = Path("mapalab_periodicity_cache.json")
CACHE_EXPIRY_HOURS: Final[int] = 24
