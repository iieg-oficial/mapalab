import { useState, useContext, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '../../../hooks/useWMSLegend';
import { useMinimap } from './useMinimap';
import { useMapView } from './useMapView';
import { useMapCapture } from './useMapCapture';
import { useImageComposition } from './useImageComposition';
import { usePdfExport } from './usePdfExport';
import { findLayerById, findParentGroup, resolveLayerDisplayName } from '../../../helpers/layers/utils/layerHelpers';
import { transformExtent } from 'ol/proj';
import { EXPORT_DIMENSIONS, QUALITY_PRESETS } from '../utils/exportDimensions';
import { getLayersSources } from '@services/layerMetadataService';
import { useEventoContext } from '@hooks/useEvento';
import { anchoParaSeleccion, crearMascara, extentDeSeleccion } from '../utils/seleccionDescarga';
import Style from 'ol/style/Style';
import { filasSeleccion, medidasDeSeleccion, MAX_CAPAS_SELECCION } from '../utils/estadisticasSeleccion';
import { agregarEnPoligono, contarEnPoligono } from '@services/seleccionStatsService';

export const useMapDownload = () => {
    const { targetRef } = useMapsContext();
    const { getLegendUrl, hasLegend } = useWMSLegend();
    const { generateMinimapImage } = useMinimap();
    const { getViewportExtent, getActiveMapRef } = useMapView();
    const { prepareScaleControl, getMapSnapshot } = useMapCapture();
    const { composeExportImage } = useImageComposition();
    const { exportToPdf, exportToImage } = usePdfExport();
    const { activeLayerIds, selectedLayer, groupedActiveLayers, allLayers, compareMode, getFilter } = useContext(MapsContext);
    const { getAliasByLayerId } = useEventoContext();
    const [isDownloading, setIsDownloading] = useState(false);

    const activeLayers = useMemo(() => activeLayerIds
        .map(id => findLayerById(id, allLayers))
        .filter(Boolean), [activeLayerIds, allLayers]);

    const layersWithLegends = useMemo(() => {
        const candidates = groupedActiveLayers.filter(layer => hasLegend(layer));
        const seenAncestors = new Set();
        const result = [];
        for (const layer of candidates) {
            const ancestor = findParentGroup(layer.id, allLayers);
            if (ancestor) {
                if (seenAncestors.has(ancestor.id)) continue;
                seenAncestors.add(ancestor.id);
            }
            const label = resolveLayerDisplayName(layer.id, layer.label, ancestor, getAliasByLayerId);
            result.push({ ...layer, label });
        }
        return result;
    }, [groupedActiveLayers, hasLegend, allLayers, getAliasByLayerId]);

    const currentSelectedLegend = useMemo(() => {
        if (selectedLayer) {
            const found = layersWithLegends.find(l => l.id === selectedLayer.id);
            if (found) return found;
        }
        return layersWithLegends[0] || null;
    }, [selectedLayer, layersWithLegends]);

    const canDownload = compareMode?.active
        ? !!(compareMode.paneA?.activeLayerIds?.length || compareMode.paneB?.activeLayerIds?.length)
        : activeLayers.length > 0;

    const getGuideExtent = () => {
        const ref = getActiveMapRef();
        if (!ref?.current) return null;

        const guideFrame = document.getElementById('export-guide-frame');
        if (!guideFrame) return getViewportExtent();

        const rect = guideFrame.getBoundingClientRect();
        const mapRect = ref.current.getTargetElement().getBoundingClientRect();

        const topLeft = [
            Math.round(rect.left - mapRect.left),
            Math.round(rect.top - mapRect.top)
        ];
        const bottomRight = [
            Math.round(rect.right - mapRect.left),
            Math.round(rect.bottom - mapRect.top)
        ];

        const coord1 = ref.current.getCoordinateFromPixel(topLeft);
        const coord2 = ref.current.getCoordinateFromPixel(bottomRight);

        if (!coord1 || !coord2) return getViewportExtent();

        const minX = Math.min(coord1[0], coord2[0]);
        const maxX = Math.max(coord1[0], coord2[0]);
        const minY = Math.min(coord1[1], coord2[1]);
        const maxY = Math.max(coord1[1], coord2[1]);

        return transformExtent([minX, minY, maxX, maxY], 'EPSG:3857', 'EPSG:4326');
    };

    const downloadMap = async (format = 'png', selectedLegends = [], viewType = 'viewport', title = 'Mapa', forcedExtent = null, quality = QUALITY_PRESETS[1], swipeOptions = null, seleccion = null, camposPorCapa = {}) => {
        const isSwipe = !!compareMode?.active;
        const captureRoot = isSwipe ? document.querySelector('[data-swipe-composite="true"]') : targetRef.current;
        if (!captureRoot || !canDownload || isDownloading) return;

        setIsDownloading(true);
        const scaleControl = captureRoot.querySelector('.ol-scale-line');
        prepareScaleControl(scaleControl);

        const { SIDE_PANEL_WIDTH } = EXPORT_DIMENSIONS;
        const { mapHeight, captureScale, composeScale } = quality;
        const poligono = seleccion?.geometria || null;
        const esSeleccion = viewType === 'seleccion' && !!poligono;
        const mapWidth = esSeleccion ? anchoParaSeleccion(poligono, quality) : quality.mapWidth;
        const trazos = esSeleccion ? (seleccion.trazos || []) : [];
        const estilos = trazos.map(trazo => trazo.getStyle() ?? null);
        trazos.forEach(trazo => trazo.setStyle(new Style({})));

        try {
            const vista = esSeleccion ? 'viewport' : viewType;
            const { url: minimapImageUrl, bounds: minimapBounds } = generateMinimapImage(vista);
            let targetExtent = null;
            if (vista === 'full-state') {
                targetExtent = getViewportExtent();
            } else if (esSeleccion) {
                targetExtent = extentDeSeleccion(poligono);
            } else {
                targetExtent = forcedExtent || getGuideExtent();
            }

            const mapCanvas = await getMapSnapshot({
                extent: targetExtent,
                viewType: vista,
                mapWidth,
                mapHeight,
                captureScale,
                swipeOptions,
                mascara: esSeleccion ? crearMascara(poligono) : null,
                onExtent: (capturado) => { targetExtent = capturado; }
            });

            if (!mapCanvas) throw new Error('Failed to capture map');

            const legendForPanel = selectedLegends.length > 0 ? selectedLegends[0] : currentSelectedLegend;

            let seleccionFilas = null;
            if (esSeleccion) {
                const capas = (selectedLegends.length > 0 ? selectedLegends : [currentSelectedLegend])
                    .filter(Boolean)
                    .slice(0, MAX_CAPAS_SELECCION);
                const conteos = await contarEnPoligono(capas, poligono, { getFilter, allLayers }).catch(() => []);
                const agregados = await Promise.all(capas
                    .filter(capa => camposPorCapa?.[capa.id])
                    .map(async (capa) => ({
                        id: capa.id,
                        etiqueta: camposPorCapa[capa.id].etiqueta,
                        datos: await agregarEnPoligono({
                            capa,
                            campo: camposPorCapa[capa.id].nombre,
                            porClase: camposPorCapa[capa.id].porClase,
                            poligono,
                            getFilter,
                            allLayers,
                        }),
                    })));
                seleccionFilas = filasSeleccion({ ...medidasDeSeleccion(poligono), capas: conteos, agregados });
            }

            const sourcesMap = await getLayersSources(activeLayerIds).catch(() => ({}));
            const source = Object.values(sourcesMap)
                .filter(Boolean)
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .join(', ') || 'Por definir';

            const finalMapCanvas = await composeExportImage({
                mapCanvas,
                extent: targetExtent || getViewportExtent(),
                sidePanelWidth: SIDE_PANEL_WIDTH,
                title,
                selectedLegend: legendForPanel,
                getLegendUrl,
                viewType: vista,
                viewportExtent: vista === 'viewport' ? targetExtent : null,
                minimapImageUrl,
                minimapBounds,
                seleccion: seleccionFilas,
                sinReticula: esSeleccion,
                source,
                scale: composeScale
            });

            if (format === 'pdf') {
                await exportToPdf({
                    canvas: finalMapCanvas,
                    title,
                    selectedLegends,
                    getLegendUrl
                });
            } else {
                exportToImage(finalMapCanvas, format, title);
            }

        } catch (error) {
            console.error('Error al descargar el mapa:', error);
        } finally {
            trazos.forEach((trazo, indice) => trazo.setStyle(estilos[indice]));
            setIsDownloading(false);
        }
    };

    return {
        downloadMap,
        isDownloading,
        canDownload,
        layersWithLegends,
        currentSelectedLegend,
        selectedLayer,
        getGuideExtent
    };
};
