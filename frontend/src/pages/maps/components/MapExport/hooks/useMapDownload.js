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

export const useMapDownload = () => {
    const { targetRef, mapRef } = useMapsContext();
    const { getLegendUrl, hasLegend, getLegendJson } = useWMSLegend();
    const { generateMinimapImage } = useMinimap();
    const { getViewportExtent, adjustViewToFullState } = useMapView();
    const { prepareScaleControl, restoreScaleControl, waitForTilesToLoad, captureMap } = useMapCapture();
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
            rect.left - mapRect.left + (rect.width * 0),
            rect.top - mapRect.top
        ];
        const bottomRight = [
            rect.right - mapRect.left,
            rect.bottom - mapRect.top
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

    const downloadMap = async (format = 'png', selectedLegends = [], viewType = 'viewport', title = 'Mapa', forcedExtent = null) => {
        if (!targetRef.current || !canDownload || isDownloading) return;

        setIsDownloading(true);
        const scaleControl = targetRef.current.querySelector('.ol-scale-line');
        const originalStyles = prepareScaleControl(scaleControl);

        let originalView = null;

        const LOGICAL_MAP_WIDTH = 1020;
        const LOGICAL_HEIGHT = 850;
        const SIDE_PANEL_WIDTH = 255;

        try {
            const minimapImageUrl = await generateMinimapImage();
            const view = mapRef.current.getView();
            const originalCenter = view.getCenter();
            const originalResolution = view.getResolution();
            let targetExtent = null;

            if (viewType === 'full-state') {
                originalView = {
                    width: targetRef.current.style.width,
                    height: targetRef.current.style.height
                };

                targetRef.current.style.width = `${LOGICAL_MAP_WIDTH}px`;
                targetRef.current.style.height = `${LOGICAL_HEIGHT}px`;
                mapRef.current.updateSize();

                adjustViewToFullState();
                targetExtent = getViewportExtent();
            } else {
                const guideExtent = forcedExtent || getGuideExtent();

                originalView = {
                    width: targetRef.current.style.width,
                    height: targetRef.current.style.height
                };

                targetRef.current.style.width = `${LOGICAL_MAP_WIDTH}px`;
                targetRef.current.style.height = `${LOGICAL_HEIGHT}px`;
                mapRef.current.updateSize();

                const extent3857 = transformExtent(guideExtent, 'EPSG:4326', 'EPSG:3857');
                mapRef.current.getView().fit(extent3857, { size: [LOGICAL_MAP_WIDTH, LOGICAL_HEIGHT] });

                targetExtent = guideExtent;
            }

            await waitForTilesToLoad();
            const scale = 2;
            const mapCanvas = await captureMap(scale);

            if (originalView) {
                targetRef.current.style.width = originalView.width;
                targetRef.current.style.height = originalView.height;
                mapRef.current.updateSize();
                mapRef.current.getView().setCenter(originalCenter);
                mapRef.current.getView().setResolution(originalResolution);
            }
            restoreScaleControl(scaleControl, originalStyles);

            const legendForPanel = selectedLegends.length > 0 ? selectedLegends[0] : currentSelectedLegend;

            const finalMapCanvas = await composeExportImage({
                mapCanvas,
                extent: targetExtent || getViewportExtent(),
                sidePanelWidth: SIDE_PANEL_WIDTH,
                title,
                selectedLegend: legendForPanel,
                getLegendUrl,
                getLegendJson,
                viewType,
                viewportExtent: viewType === 'viewport' ? targetExtent : null,
                minimapImageUrl,
                scale
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
            if (originalView && targetRef.current && mapRef.current) {
                targetRef.current.style.width = originalView.width;
                targetRef.current.style.height = originalView.height;
                mapRef.current.updateSize();
            }
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
