from qgis.PyQt.QtCore import QSettings

SETTINGS_GROUP: str = 'mapalab'
SETTINGS_BASE_URL: str = f'{SETTINGS_GROUP}/base_url'

DEFAULT_BASE_URL: str = ''

CLIENT_HEADER: bytes = b'X-Mapalab-Client'
CLIENT_VALUE: bytes = b'qgis-plugin/0.1.0'

DATA_CRS: str = 'EPSG:6368'
DOWNLOAD_CRS: str = 'EPSG:6368'

TILE_SIZE: int = 256
WMS_FORMAT: str = 'image/png'
WMS_VERSION: str = '1.1.0'

TREE_CACHE_FILE: str = 'layer_tree.json'
ETAG_CACHE_FILE: str = 'layer_tree.etag'

REQUEST_TIMEOUT_MS: int = 30000
DOWNLOAD_TIMEOUT_MS: int = 600000


def get_base_url() -> str:
    stored = QSettings().value(SETTINGS_BASE_URL, DEFAULT_BASE_URL)
    return str(stored or '').rstrip('/')


def set_base_url(value: str) -> None:
    QSettings().setValue(SETTINGS_BASE_URL, value.strip().rstrip('/'))


def api_url(path: str) -> str:
    return f'{get_base_url()}/mapalab/api{path}'


def geoserver_url(workspace: str) -> str:
    return f'{get_base_url()}/sextante/{workspace}/wms'


def wfs_url(workspace: str) -> str:
    return f'{get_base_url()}/sextante/{workspace}/wfs'
