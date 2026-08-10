from typing import Any, Optional

from qgis.core import QgsAbstractMetadataBase, QgsLayerMetadata, QgsMapLayer


def _first_record(payload: Any) -> Optional[dict[str, Any]]:
    if isinstance(payload, list) and payload:
        return payload[0] if isinstance(payload[0], dict) else None
    if isinstance(payload, dict):
        return payload
    return None


def _collect_sources(record: dict[str, Any]) -> list[str]:
    sources = record.get('fuentes')
    if isinstance(sources, list):
        return [str(item.get('nombre') or item) for item in sources if item]
    if isinstance(sources, str) and sources:
        return [sources]
    return []


def build_abstract(record: dict[str, Any]) -> str:
    parts: list[str] = []
    for key in ('descripcion', 'metodologia', 'texto_leyenda'):
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            parts.append(value.strip())
        elif isinstance(value, dict):
            nested = value.get('texto') or value.get('descripcion')
            if isinstance(nested, str) and nested.strip():
                parts.append(nested.strip())
    return '\n\n'.join(parts)


def apply_metadata(layer: QgsMapLayer, payload: Any, node: dict[str, Any]) -> bool:
    record = _first_record(payload)
    if record is None:
        return False

    metadata = QgsLayerMetadata()
    metadata.setTitle(str(record.get('tema') or node.get('label') or ''))

    abstract = build_abstract(record)
    if abstract:
        metadata.setAbstract(abstract)

    sources = _collect_sources(record)
    if sources:
        metadata.setRights(sources)

    frequency = record.get('frecuencia')
    if frequency:
        metadata.addKeywords('frecuencia', [str(frequency)])

    last_date = record.get('fecha_ultima')
    if last_date:
        metadata.addKeywords('actualizacion', [str(last_date)])

    link = record.get('link_final_capa')
    if link:
        entry = QgsAbstractMetadataBase.Link()
        entry.name = 'MapaLab'
        entry.type = 'WWW:LINK'
        entry.url = str(link)
        metadata.addLink(entry)

    layer.setMetadata(metadata)
    return True
