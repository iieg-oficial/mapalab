from typing import Any, Callable, Optional

from qgis.core import QgsCoordinateReferenceSystem, QgsMapLayer, QgsProject
from qgis.gui import QgsMapToolIdentify

from ..api.client import MapaLabClient, MapaLabError
from ..config import NODE_ID_PROPERTY
from ..layers.featureinfo import features_de_json, url_de_consulta
from ..layers.limites import modo_actual
from ..layers.proyecto import capa_por_nodo
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





class HerramientaConsulta(QgsMapToolIdentify):

    def __init__(self, canvas: Any, client: MapaLabClient,
                 nodo_actual: Callable[[], Optional[dict[str, Any]]],
                 al_consultar: Callable[[Optional[tuple], str], None]) -> None:
        super().__init__(canvas)
        self._client = client
        self._nodo_actual = nodo_actual
        self._al_consultar = al_consultar

    def canvasReleaseEvent(self, evento: Any) -> None:
        x, y = int(evento.x()), int(evento.y())
        node = self._nodo_actual()

        if node and node.get('wmsConfig'):
            capa = capa_por_nodo(str(node.get('id') or ''))
            if capa is None:
                self._consultar_catalogo(node, x, y)
            else:
                self._consultar_cargadas([capa], x, y)
            return

        activa = self._capa_activa()
        if activa is not None:
            self._consultar_cargadas([activa], x, y)
            return

        self._consultar_cargadas(capas_del_plugin(), x, y)

    def _capa_activa(self) -> Optional[QgsMapLayer]:
        capa = self.canvas().currentLayer()
        if capa is None or not capa.customProperty(NODE_ID_PROPERTY):
            return None
        return capa

    def _consultar_cargadas(self, capas: list[QgsMapLayer], x: int, y: int) -> None:
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
                              canvas.height(), crs.authid(), x, y, modo_actual())
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
