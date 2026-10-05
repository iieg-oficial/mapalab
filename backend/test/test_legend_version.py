from datetime import datetime, timezone

from app.models.layer import Layer, Workspace
from app.services.layer_tree_service import (
    _compute_etag,
    _layer_to_wms_config,
    _legend_signature,
)

_FECHA = datetime(2026, 10, 5, tzinfo=timezone.utc)


def _ws(alias: str, version: int) -> Workspace:
    return Workspace(alias=alias, geoserver_workspace=alias, db_schema=alias, legend_version=version)


def test_el_wms_config_lleva_la_version_de_leyenda_del_workspace() -> None:
    capa = Layer(id='nddi', workspace_alias='raster', geoserver_layer='nddi')
    config = _layer_to_wms_config(capa, {'raster': _ws('raster', 7)})
    assert config['legendVersion'] == 7


def test_subir_la_version_cambia_el_etag_aunque_las_capas_no_cambien() -> None:
    antes = _compute_etag(_FECHA, 140, _legend_signature([_ws('raster', 1), _ws('general', 1)]))
    despues = _compute_etag(_FECHA, 140, _legend_signature([_ws('raster', 2), _ws('general', 1)]))
    assert antes != despues


def test_la_firma_no_depende_del_orden_de_los_workspaces() -> None:
    a = _legend_signature([_ws('raster', 3), _ws('general', 1)])
    b = _legend_signature([_ws('general', 1), _ws('raster', 3)])
    assert a == b
