from typing import Any


def classFactory(iface: Any):
    from .plugin import MapaLabPlugin
    return MapaLabPlugin(iface)
