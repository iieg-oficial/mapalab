from __future__ import annotations

import json
import traceback
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from fastmcp import FastMCP
from fastmcp.exceptions import ToolError
from mcp.types import ToolAnnotations

from app.utils.logger import Logger
from servers.blindaje import ES_BETA

TIMEOUT_TOOL_S = 90.0

LECTURA = ToolAnnotations(read_only_hint=True, destructive_hint=False, idempotent_hint=True, open_world_hint=False)
ESCRITURA = ToolAnnotations(read_only_hint=False, destructive_hint=False, idempotent_hint=True, open_world_hint=False)

_REGLAS = [
    'IDENTIFICADORES: usa el `id` que devuelve search_layers. No inventes ids, slugs ni claves de municipio; un id ambiguo o de grupo devuelve error con las opciones.',
    'WORKSPACE: nunca lo pases; se resuelve solo desde el árbol.',
    'FLUJO TÍPICO: search_layers -> describe_layer -> (municipios) -> create_map.',
    'BASEMAPS: voyager, position, sin_mapalab. NO existe osm.',
    'FECHAS: `year` (y `month`) se validan contra describe_layer.periodicidad; el error dice qué años hay.',
    'COORDENADAS: no las inventes. Usa layer_table con coordenadas=True y por_pagina bajo.',
    'CIFRAS: para contar, sumar, promediar o repartir por clase usa layer_stats; no pagines layer_table para calcular.',
    'ERRORES: llegan como error de la tool con un mensaje accionable; corrige el argumento y vuelve a intentar.',
]
if ES_BETA:
    _REGLAS.append('COMPARAR: create_swipe compara una capa en dos años o dos capas lado a lado.')


def _version_mapalab() -> str:
    try:
        return str(json.loads(Path('/app/package.json').read_text())['version'])
    except (OSError, ValueError, KeyError):
        return 'dev'


mcp = FastMCP(
    name='mapalab',
    version=_version_mapalab(),
    instructions='Reglas del servidor MapaLab MCP:\n' + '\n'.join(f'{i}. {r}' for i, r in enumerate(_REGLAS, 1)),
    mask_error_details=True,
)


@contextmanager
def como_error_de_tool() -> Iterator[None]:
    try:
        yield
    except ValueError as exc:
        _registrar_error(exc)
        raise ToolError(str(exc)) from None


def _registrar_error(exc: ValueError) -> None:
    marcos = traceback.extract_tb(exc.__traceback__)
    tool = next((m.name for m in marcos if Path(m.filename).name.startswith('herramientas_')), '?')
    origen = f'{Path(marcos[-1].filename).name}:{marcos[-1].lineno}' if marcos else '?'
    Logger.warning(f'mcp.tool_error tool={tool} origen={origen}')
