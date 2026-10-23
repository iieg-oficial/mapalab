from __future__ import annotations

import re
from typing import Iterable, Optional

from servers.resolve import es_capa, normalizar

VACIAS = frozenset({
    'a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los', 'o', 'para', 'por',
    'que', 'se', 'sin', 'u', 'un', 'una', 'unas', 'unos', 'y',
})
SINONIMOS = {
    'hospital': ('salud',), 'clinica': ('salud',), 'colegio': ('escuela',),
    'crimen': ('delito',), 'delincuencia': ('delito',),
}
PESO_ETIQUETA, PESO_CLAVE, PESO_TAG, PESO_RUTA = 4, 3, 3, 1
MAX_SUFIJO = 3
_SEPARADOR = re.compile(r'[^a-z0-9]+')


def palabras(texto: str) -> list[str]:
    return [p for p in _SEPARADOR.split(normalizar(texto)) if p]


def variantes(palabra: str) -> set[str]:
    formas = {palabra}
    if len(palabra) > 4 and palabra.endswith('es'):
        formas.add(palabra[:-2])
    if len(palabra) > 3 and palabra.endswith('s'):
        formas.add(palabra[:-1])
    return formas | {s for f in tuple(formas) for s in SINONIMOS.get(f, ())}


def indice_de_capas(tree: list[dict]) -> dict[str, dict]:
    index: dict[str, dict] = {}

    def walk(nodes: list[dict], parent_path: list[str]) -> None:
        for node in nodes:
            path = parent_path + [node['label']]
            if es_capa(node) and node['id'] not in index:
                index[node['id']] = {'node': node, 'path': path}
            walk(node.get('children') or [], path)

    walk(tree, [])
    return index


def _campos(entrada: dict) -> list[tuple[int, set[str]]]:
    node = entrada['node']
    claves = [node['id'], node.get('slug') or '', *(node.get('aliases') or [])]
    tags = (node.get('searchMeta') or {}).get('tags') or []
    return [
        (PESO_ETIQUETA, set(palabras(node.get('label') or ''))),
        (PESO_CLAVE, {p for c in claves for p in palabras(c)}),
        (PESO_TAG, {p for t in tags for p in palabras(t)}),
        (PESO_RUTA, {p for etiqueta in entrada['path'][:-1] for p in palabras(etiqueta)}),
    ]


def _coincide(palabra: str, del_campo: set[str]) -> bool:
    formas = variantes(palabra)
    if len(palabra) < 3:
        return bool(formas & del_campo)
    return any(p.startswith(f) and len(p) - len(f) <= MAX_SUFIJO for f in formas for p in del_campo)


def _puntaje(terminos: list[str], frase: str, entrada: dict) -> tuple[int, int]:
    campos = _campos(entrada)
    pesos = [max((peso for peso, del_campo in campos if _coincide(t, del_campo)), default=0) for t in terminos]
    node = entrada['node']
    exacta = frase in {normalizar(node.get('label') or ''), normalizar(node['id']), normalizar(node.get('slug') or '')}
    return sum(1 for p in pesos if p), sum(pesos) + (20 if exacta else 0)


def buscar(index: dict[str, dict], query: str, permitidos: Optional[Iterable[str]] = None) -> list[str]:
    """Ids ordenados por relevancia. Solo quedan las capas que cubren más palabras de la consulta."""
    terminos = [p for p in palabras(query) if p not in VACIAS]
    if not terminos:
        return []
    frase = normalizar(query)
    ids = list(permitidos) if permitidos is not None else list(index)
    puntuadas = []
    for orden, layer_id in enumerate(ids):
        entrada = index.get(layer_id)
        if entrada:
            cubiertas, puntos = _puntaje(terminos, frase, entrada)
            if cubiertas:
                puntuadas.append((cubiertas, puntos, -orden, layer_id))
    if not puntuadas:
        return []
    mejor = max(p[0] for p in puntuadas)
    return [p[3] for p in sorted((p for p in puntuadas if p[0] == mejor), reverse=True)]
