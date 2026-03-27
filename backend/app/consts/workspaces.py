WORKSPACE_SCHEMA_MAP: dict[str, str] = {
    'general': 'mapa_base',
    'seguridad': 'seguridad_y_proteccion_ciudadana',
    'gobierno': 'gobierno_y_ciudadania',
    'desarrollo': 'desarrollo_social',
    'recursos': 'recursos_y_calidad_de_vida',
}


def resolve_schema(workspace: str) -> str:
    return WORKSPACE_SCHEMA_MAP.get(workspace, workspace)
