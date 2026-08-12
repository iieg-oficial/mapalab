from typing import Any, Callable, Optional

from qgis.core import QgsCoordinateReferenceSystem, QgsMapLayer, QgsProject
from qgis.gui import QgsMapToolIdentify

from ..api.client import MapaLabClient, MapaLabError
from ..config import NODE_ID_PROPERTY
from ..layers.featureinfo import features_de_json, url_de_consulta
from ..model.tree import clean_label


def capas_del_plugin() -> list[QgsMapLayer]:
    capas: list[QgsMapLayer] = []
    for nodo in QgsProject.instance().layerTreeRoot().findLayers():
        capa = nodo.layer()
        if capa is None or not nodo.isVisible():
            continue
        if capa.customProperty(NODE_ID_PROPERTY):
            capas.append(capa)
    return capas


def esta_cargada(node_id: str) -> bool:
    return any(str(capa.customProperty(NODE_ID_PROPERTY) or '') == node_id
               for capa in QgsProject.instance().mapLayers().values())


class HerramientaConsulta(QgsMapToolIdentify):

    def __init__(self, canvas: Any, client: MapaLabClient,
                 nodo_actual: Callable[[], Optional[dict[str, Any]]],
                 al_consultar: Callable[[Optional[tuple], str], None]) -> None:
        super().__init__(canvas)
        self._client = client
        self._nodo_actual = nodo_actual
        self._al_consultar = al_consultar

    def canvasReleaseEvent(self, evento: Any) -> None:
        node = self._nodo_actual()
        if node and node.get('wmsConfig') and not esta_cargada(str(node.get('id') or '')):
            self._consultar_catalogo(node, int(evento.x()), int(evento.y()))
            return
        self._consultar_cargadas(int(evento.x()), int(evento.y()))

    def _consultar_cargadas(self, x: int, y: int) -> None:
        capas = capas_del_plugin()
        if not capas:
            self._al_consultar(None, 'Selecciona una capa del árbol o agrégala al mapa.')
            return

        resultados = self.identify(x, y, capas, QgsMapToolIdentify.TopDownStopAtFirst)
        if not resultados:
            self._al_consultar(None, 'Sin elementos de MapaLab en ese punto.')
            return

        capa = resultados[0].mLayer
        elementos = [(r.mFeature, str(r.mFeature.id()))
                     for r in resultados if r.mLayer is capa and r.mFeature.hasGeometry()]
        if not elementos:
            self._al_consultar(None, 'Ese elemento llegó sin geometría.')
            return

        datos = (str(capa.customProperty(NODE_ID_PROPERTY) or ''), capa.name(),
                 capa.crs(), elementos)
        self._al_consultar(datos, '')

    def _consultar_catalogo(self, node: dict[str, Any], x: int, y: int) -> None:
        canvas = self.canvas()
        settings = canvas.mapSettings()
        crs: QgsCoordinateReferenceSystem = settings.destinationCrs()
        url = url_de_consulta(node['wmsConfig'], settings.extent(), canvas.width(),
                              canvas.height(), crs.authid(), x, y)
        if not url:
            self._al_consultar(None, 'Esa capa no trae configuración WMS.')
            return

        try:
            texto = self._client.fetch_text(url)
        except MapaLabError as error:
            self._al_consultar(None, f'No se pudo consultar la capa: {error}')
            return

        features = features_de_json(texto)
        if not features:
            self._al_consultar(None, 'Sin elementos de esa capa en ese punto.')
            return

        datos = (str(node.get('id') or ''), clean_label(node.get('label') or ''), crs,
                 features)
        self._al_consultar(datos, '')
