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

LOGOS_PATH: str = '/acervo/iieg/logos'

LOGOS: dict[str, tuple[str, str]] = {
    'mapalab': ('mapalab_large.svg', 'mapalab_large_dark.svg'),
    'iieg': ('iieg_large.svg', 'iieg_large_dark.svg'),
    'jalisco': ('jalisco_large.svg', 'jalisco_large_dark.svg'),
}

TEMAS_PATH: str = '/acervo/mapalab/svg/temas'

ICONO_ARCHIVO: str = 'mapalab_short.svg'

ICONO_CACHE: str = 'toolbar_icon.svg'

LOGO_HEIGHT: int = 40

FOOTER_BAR_HEIGHT: int = LOGO_HEIGHT + 12

FOOTER_LOGO_HEIGHT: int = LOGO_HEIGHT

FONT_SCALE_PX: int = 2

SECTION_GAP: int = 14

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


def tema_icono_url(alias: str) -> str:
    base = get_base_url()
    return f'{base}{TEMAS_PATH}/{alias}.svg' if base and alias else ''


def logo_url(marca: str, oscuro: bool) -> str:
    claro, oscuro_file = LOGOS.get(marca, ('', ''))
    archivo = oscuro_file if oscuro and oscuro_file else claro
    return f'{get_base_url()}{LOGOS_PATH}/{archivo}' if archivo else ''
