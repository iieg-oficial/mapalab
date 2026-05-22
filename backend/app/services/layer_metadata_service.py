from typing import Optional

from sqlalchemy.orm import Session

from app.consts.databases import DatabaseType
from app.consts.workspaces import resolve_schema
from app.databases.factory import DatabaseFactory
from app.models.layer import Layer, LayerMetadata, LayerStats, Workspace


def _resolve_workspace_name(session: Session, workspace_alias: str) -> str:
    ws = session.query(Workspace).filter(Workspace.alias == workspace_alias).first()
    if ws:
        return ws.geoserver_workspace
    return resolve_schema(workspace_alias)


def _resolve_layer_key(session: Session, workspace_alias: str, layer: str) -> str:
    ws_name = _resolve_workspace_name(session, workspace_alias)
    row = (
        session.query(Layer)
        .filter(Layer.workspace_alias == workspace_alias, Layer.id == layer)
        .first()
    )
    if row and row.geoserver_layer:
        return f'{ws_name}:{row.geoserver_layer}'
    return f'{ws_name}:{layer}'


def _metadato_with_acervo(metadato: Optional[list], acervo_base: str) -> Optional[list]:
    if not metadato:
        return None
    result = []
    for item in metadato:
        nombre = item.get('nombre')
        enlace = item.get('enlace')
        if not enlace:
            continue
        if acervo_base and not enlace.startswith('http'):
            filename = enlace.lstrip('/')
            if 'TXT' in (nombre or '').upper() or enlace.lower().endswith('.txt'):
                enlace = f"{acervo_base}/mapalab/metadata/txt/{filename}"
            elif 'XLSX' in (nombre or '').upper() or enlace.lower().endswith('.xlsx'):
                enlace = f"{acervo_base}/mapalab/metadata/xlsx/{filename}"
        result.append({'nombre': nombre, 'enlace': enlace})
    return result or None


def _numeralia_from_stats(stats: Optional[LayerStats]) -> list:
    if not stats or not stats.values:
        return [{'valor': None, 'nombre': None, 'simbolo': None} for _ in range(8)]
    by_pos = {v.get('posicion'): v for v in stats.values if isinstance(v, dict)}
    result = []
    for i in range(1, 9):
        v = by_pos.get(i)
        if v:
            result.append({
                'valor': v.get('valor'),
                'nombre': v.get('nombre'),
                'simbolo': v.get('simbolo'),
            })
        else:
            result.append({'valor': None, 'nombre': None, 'simbolo': None})
    return result


def get_metadata_response(
    workspace_alias: str, layer: str, acervo_base: str = ''
) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer_key = _resolve_layer_key(session, workspace_alias, layer)

        meta = session.query(LayerMetadata).filter(LayerMetadata.layer_key == layer_key).first()
        if not meta:
            return None

        stats = session.query(LayerStats).filter(LayerStats.layer_key == layer_key).first()

        fuentes = meta.fuentes or {}
        metodologia = meta.metodologia or {}

        return {
            'tema': (meta.layer_name_usuario or '').split(':')[0] if meta.layer_name_usuario else '',
            'subtema': None,
            'link_final_capa': meta.link_final_capa,
            'capa_descargable': 'true' if meta.downloadable else 'false',
            'capa_finalizada_geoserver': layer_key,
            'nombre_capa_db': meta.layer_name_db,
            'nombre_capa_geoserver': layer_key,
            'nombre_capa_usuario': meta.layer_name_usuario,
            'descripcion': meta.descripcion,
            'frecuencia_actualizacion': meta.frecuencia,
            'fecha_ultima_actualizacion': meta.fecha_ultima,
            'metodologia_texto': metodologia.get('texto'),
            'metodologia_archivo_enlace': metodologia.get('archivo_enlace'),
            'fuentes_texto_largo': fuentes.get('largo'),
            'fuentes_texto_corto': fuentes.get('corto'),
            'fuentes_enlace': fuentes.get('enlace'),
            'tipo_mapa': meta.tipo_mapa,
            'texto_leyenda_juridico': meta.texto_leyenda,
            'tipo_mapa_enlace': meta.tipo_mapa_enlace,
            'metadato_txt': None,
            'metadato_xlsx': None,
            'tarjeta_punto_poligono': meta.tarjeta_punto_poligono,
            'created_at': None,
            'numeralia': _numeralia_from_stats(stats),
            'nombre_pie_numeralia': stats.pie_numeralia if stats else None,
            'metadato': _metadato_with_acervo(meta.metadato, acervo_base),
        }


def get_sources_batch(layer_keys: list[str]) -> list[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        rows = (
            session.query(LayerMetadata.layer_key, LayerMetadata.fuentes)
            .filter(LayerMetadata.layer_key.in_(layer_keys))
            .all()
        )
    result = []
    for row in rows:
        fuentes = row.fuentes or {}
        result.append({
            'nombre_capa_geoserver': row.layer_key,
            'fuentes_texto_corto': fuentes.get('corto') or fuentes.get('largo'),
        })
    return result
