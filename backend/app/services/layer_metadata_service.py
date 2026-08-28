from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.consts.databases import DatabaseType
from app.consts.workspaces import resolve_schema
from app.databases.factory import DatabaseFactory
from app.models.layer import Layer, LayerMetadata, LayerStats, Workspace
from app.services.stats_engine import build_recetas, compute_numeralia
from app.services.stats_ranking import compute_ranking
from app.services.stats_builder import calcular_personalizada, catalogo_de_capa


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


def _to_list_of_dicts(value) -> list[dict]:
    if not value:
        return []
    if isinstance(value, dict):
        return [value]
    if isinstance(value, list):
        return [it for it in value if isinstance(it, dict) and any(v not in (None, '') for v in it.values())]
    return []


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
    return _numeralia_from_values(stats.values if stats else None)


def _numeralia_from_values(values: Optional[list]) -> list:
    if not values:
        return [{'valor': None, 'nombre': None, 'simbolo': None} for _ in range(8)]
    by_pos = {v.get('posicion'): v for v in values if isinstance(v, dict)}
    result = []
    for i in range(1, 9):
        v = by_pos.get(i)
        if v:
            result.append({
                'valor': v.get('valor'),
                'nombre': v.get('nombre'),
                'simbolo': v.get('simbolo'),
                'receta': v.get('receta'),
            })
        else:
            result.append({'valor': None, 'nombre': None, 'simbolo': None})
    return result


def _municipio_context(session, claves: list[str]) -> dict:
    rows = session.execute(
        text('SELECT clave_geo, nombre FROM mapalab.municipios WHERE clave_geo = ANY(:claves)'),
        {'claves': claves},
    ).fetchall()
    nombres = [r[1] for r in rows]
    return {'municipio.claves': claves, 'municipio.nombres': nombres}


def build_stats_context(session, claves: list[str], fecha_inicio: str, fecha_fin: str) -> dict:
    context: dict = {}
    if claves:
        context.update(_municipio_context(session, claves))
    if fecha_inicio:
        context['fecha.inicio'] = fecha_inicio
    if fecha_fin:
        context['fecha.fin'] = fecha_fin
    return context


def _ambito_geografico(nombres: list[str]) -> str:
    if not nombres:
        return 'Jalisco'
    if len(nombres) == 1:
        return nombres[0]
    if len(nombres) <= 3:
        return f"{', '.join(nombres[:-1])} y {nombres[-1]}"
    return f'{len(nombres)} municipios'


def _ambito_temporal(inicio: Optional[str], fin: Optional[str]) -> Optional[str]:
    if inicio and fin:
        anio_inicio, anio_fin = inicio[:4], fin[:4]
        return anio_inicio if anio_inicio == anio_fin else f'{anio_inicio}–{anio_fin}'
    if inicio:
        return f'desde {inicio}'
    if fin:
        return f'hasta {fin}'
    return None


def _periodo_del_dato(session, layer_key: str) -> Optional[str]:
    periodicity = session.execute(
        text('SELECT periodicity FROM public.layer_periodicity WHERE layer_key = :k'),
        {'k': layer_key},
    ).scalar()
    if not isinstance(periodicity, dict) or not periodicity:
        return None
    anios = sorted(a for a in periodicity if str(a).isdigit())
    if not anios:
        return None
    return anios[0] if anios[0] == anios[-1] else f'{anios[0]}–{anios[-1]}'


def build_ambito(session, layer_key: str, context: Optional[dict]) -> dict:
    context = context or {}
    claves = context.get('municipio.claves') or []
    nombres = context.get('municipio.nombres') or []
    temporal = _ambito_temporal(context.get('fecha.inicio'), context.get('fecha.fin'))
    return {
        'geografico': _ambito_geografico(nombres),
        'temporal': temporal or _periodo_del_dato(session, layer_key),
        'claves': claves,
        'filtrado': bool(claves or context.get('fecha.inicio') or context.get('fecha.fin')),
    }


def get_catalogo_response(workspace_alias: str, layer: str) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer_key = _resolve_layer_key(session, workspace_alias, layer)
        stats = session.query(LayerStats).filter(LayerStats.layer_key == layer_key).first()
        if not stats or not stats.stats_config:
            return None
        return catalogo_de_capa(session, layer_key, stats.stats_config)


def get_personalizada_response(
    workspace_alias: str, layer: str, definicion: dict, context: Optional[dict] = None
) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer_key = _resolve_layer_key(session, workspace_alias, layer)
        stats = session.query(LayerStats).filter(LayerStats.layer_key == layer_key).first()
        if not stats or not stats.stats_config:
            return None
        return calcular_personalizada(session, layer_key, stats.stats_config, definicion, context)


def get_ranking_response(
    workspace_alias: str, layer: str, context: Optional[dict] = None
) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer_key = _resolve_layer_key(session, workspace_alias, layer)
        stats = session.query(LayerStats).filter(LayerStats.layer_key == layer_key).first()
        if not stats or not stats.stats_config:
            return None
        return compute_ranking(session, layer_key, stats.stats_config, context)


def get_metadata_response(
    workspace_alias: str, layer: str, acervo_base: str = '', context: Optional[dict] = None
) -> Optional[dict]:
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer_key = _resolve_layer_key(session, workspace_alias, layer)

        meta = session.query(LayerMetadata).filter(LayerMetadata.layer_key == layer_key).first()
        if not meta:
            return None

        stats = session.query(LayerStats).filter(LayerStats.layer_key == layer_key).first()

        numeralia = _numeralia_from_stats(stats)
        ambito = build_ambito(session, layer_key, context)
        if context and stats and stats.stats_config:
            calculada = compute_numeralia(
                session, layer_key, stats.stats_config, context, stats.ttl_minutes or 1440
            )
            if calculada:
                numeralia = _numeralia_from_values(calculada)
        elif stats and stats.stats_config:
            recetas = build_recetas(session, layer_key, stats.stats_config, context)
            for slot, item in enumerate(numeralia, start=1):
                if recetas.get(slot):
                    item['receta'] = recetas[slot]

        fuentes_list = _to_list_of_dicts(meta.fuentes)
        metodologia_list = _to_list_of_dicts(meta.metodologia)
        fuente_primaria = fuentes_list[0] if fuentes_list else {}
        metodologia_primaria = metodologia_list[0] if metodologia_list else {}

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
            'metodologia_texto': metodologia_primaria.get('texto'),
            'metodologia_archivo_enlace': metodologia_primaria.get('archivo_enlace'),
            'fuentes_texto_largo': fuente_primaria.get('largo'),
            'fuentes_texto_corto': fuente_primaria.get('corto'),
            'fuentes_enlace': fuente_primaria.get('enlace'),
            'tipo_mapa': meta.tipo_mapa,
            'texto_leyenda_juridico': meta.texto_leyenda,
            'tipo_mapa_enlace': meta.tipo_mapa_enlace,
            'metadato_txt': None,
            'metadato_xlsx': None,
            'tarjeta_punto_poligono': meta.tarjeta_punto_poligono,
            'created_at': None,
            'numeralia': numeralia,
            'ambito': ambito,
            'nombre_pie_numeralia': stats.pie_numeralia if stats else None,
            'metadato': _metadato_with_acervo(meta.metadato, acervo_base),
            'fuentes': fuentes_list or None,
            'metodologia': metodologia_list or None,
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
        fuentes_list = _to_list_of_dicts(row.fuentes)
        fuente_primaria = fuentes_list[0] if fuentes_list else {}
        result.append({
            'nombre_capa_geoserver': row.layer_key,
            'fuentes_texto_corto': fuente_primaria.get('corto') or fuente_primaria.get('largo'),
        })
    return result
