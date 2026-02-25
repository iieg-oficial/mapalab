import { useState, useContext, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '../../../hooks/useWMSLegend';
import { useMinimap } from './useMinimap';
import { useMapView } from './useMapView';
import { useMapCapture } from './useMapCapture';
import { useImageComposition } from './useImageComposition';
import { usePdfExport } from './usePdfExport';
import { layers as allLayers, findLayerById } from '../../../helpers/layers/index';
import { transformExtent } from 'ol/proj';
import { EXPORT_DIMENSIONS, QUALITY_PRESETS } from '../utils/exportDimensions';
import { getLayersSources } from '@services/layerMetadataService';

export const useMapDownload = () => {
    const { targetRef, mapRef } = useMapsContext();
    const { getLegendUrl, hasLegend } = useWMSLegend();
    const { generateMinimapImage } = useMinimap();
    const { getViewportExtent } = useMapView();
    const { prepareScaleControl, getMapSnapshot } = useMapCapture();
    const { composeExportImage } = useImageComposition();
    const { exportToPdf, exportToImage } = usePdfExport();
    const { activeLayerIds, selectedLayer, groupedActiveLayers } = useContext(MapsContext);
    const [isDownloading, setIsDownloading] = useState(false);

    const activeLayers = useMemo(() => activeLayerIds
        .map(id => findLayerById(id, allLayers))
        .filter(Boolean), [activeLayerIds]);

    const layersWithLegends = useMemo(() => {
        return groupedActiveLayers.filter(layer => hasLegend(layer));
    }, [groupedActiveLayers, hasLegend]);

    const currentSelectedLegend = useMemo(() => {
        if (selectedLayer) {
            const found = layersWithLegends.find(l => l.id === selectedLayer.id);
            if (found) return found;
        }
        return layersWithLegends[0] || null;
    }, [selectedLayer, layersWithLegends]);

    const canDownload = activeLayers.length > 0;

    const getGuideExtent = () => {
        if (!mapRef.current) return null;

        const guideFrame = document.getElementById('export-guide-frame');
        if (!guideFrame) return getViewportExtent();

        const rect = guideFrame.getBoundingClientRect();
        const mapRect = mapRef.current.getTargetElement().getBoundingClientRect();

        const topLeft = [
            Math.round(rect.left - mapRect.left),
            Math.round(rect.top - mapRect.top)
        ];
        const bottomRight = [
            Math.round(rect.right - mapRect.left),
            Math.round(rect.bottom - mapRect.top)
        ];

        const coord1 = mapRef.current.getCoordinateFromPixel(topLeft);
        const coord2 = mapRef.current.getCoordinateFromPixel(bottomRight);

        if (!coord1 || !coord2) return getViewportExtent();

        const minX = Math.min(coord1[0], coord2[0]);
        const maxX = Math.max(coord1[0], coord2[0]);
        const minY = Math.min(coord1[1], coord2[1]);
        const maxY = Math.max(coord1[1], coord2[1]);

        return transformExtent([minX, minY, maxX, maxY], 'EPSG:3857', 'EPSG:4326');
    };

    const downloadMap = async (format = 'png', selectedLegends = [], viewType = 'viewport', title = 'Mapa', forcedExtent = null, quality = QUALITY_PRESETS[1]) => {
        if (!targetRef.current || !canDownload || isDownloading) return;

        setIsDownloading(true);
        const scaleControl = targetRef.current.querySelector('.ol-scale-line');
        prepareScaleControl(scaleControl);

        const { SIDE_PANEL_WIDTH } = EXPORT_DIMENSIONS;
        const { mapWidth, mapHeight, captureScale, composeScale } = quality;

        try {
            const { url: minimapImageUrl, bounds: minimapBounds } = generateMinimapImage(viewType);
            let targetExtent = null;
            if (viewType === 'full-state') {
                targetExtent = getViewportExtent();
            } else {
                targetExtent = forcedExtent || getGuideExtent();
            }

            const mapCanvas = await getMapSnapshot({
                extent: targetExtent,
                viewType,
                mapWidth,
                mapHeight,
                captureScale
            });

            if (!mapCanvas) throw new Error('Failed to capture map');

            const legendForPanel = selectedLegends.length > 0 ? selectedLegends[0] : currentSelectedLegend;

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
                viewType,
                viewportExtent: viewType === 'viewport' ? targetExtent : null,
                minimapImageUrl,
                minimapBounds,
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
