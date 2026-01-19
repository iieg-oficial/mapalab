import { useState, useContext, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '../../../hooks/useWMSLegend';
import { useMinimap } from './useMinimap';
import { useMapView } from './useMapView';
import { useMapCapture } from './useMapCapture';
import { usePdfExport } from './usePdfExport';
import coordinateGrid from '../utils/coordinateGrid';
import northArrow from '../utils/northArrow';
import createExportSidePanel from '../ExportSidePanel';
import { layers as allLayers, findLayerById } from '../../../helpers/layers/index';

export const useMapDownload = () => {
    const { targetRef } = useMapsContext();
    const { getLegendUrl, hasLegend } = useWMSLegend();
    const { generateMinimapImage } = useMinimap();
    const { getViewportExtent, adjustViewToFullState, restoreView } = useMapView();
    const { prepareScaleControl, restoreScaleControl, waitForTilesToLoad, captureMap, captureElement, waitForImages } = useMapCapture();
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

    const downloadMap = async (format = 'png', selectedLegends = [], viewType = 'viewport', title = 'Mapa') => {
        if (!targetRef.current || !canDownload || isDownloading) return;

        setIsDownloading(true);
        const scaleControl = targetRef.current.querySelector('.ol-scale-line');
        const originalStyles = prepareScaleControl(scaleControl);

        let currentViewportExtent = getViewportExtent();
        let originalView = null;

        try {
            const minimapImageUrl = await generateMinimapImage();

            if (viewType === 'full-state') {
                originalView = adjustViewToFullState();
                await waitForTilesToLoad();
            } else {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const extent = getViewportExtent();
            const mapCanvas = await captureMap(2);

            restoreScaleControl(scaleControl, originalStyles);

            const sidePanelWidth = 280 * 2;
            const totalWidth = mapCanvas.width + sidePanelWidth;

            const tempContainer = document.createElement('div');
            Object.assign(tempContainer.style, {
                position: 'absolute',
                left: '-9999px',
                width: `${totalWidth}px`,
                height: `${mapCanvas.height}px`,
                backgroundColor: '#ffffff'
            });

            const mapSection = document.createElement('div');
            Object.assign(mapSection.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: `${mapCanvas.width}px`,
                height: `${mapCanvas.height}px`
            });

            const mapImage = document.createElement('img');
            mapImage.src = mapCanvas.toDataURL('image/png');
            Object.assign(mapImage.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '1'
            });

            const grid = coordinateGrid(mapCanvas.width / 2, mapCanvas.height / 2, extent);
            grid.style.transform = 'scale(2)';
            grid.style.transformOrigin = 'top left';

            const arrow = northArrow();
            arrow.style.transform = 'scale(2)';
            arrow.style.transformOrigin = 'top left';

            mapSection.appendChild(mapImage);
            mapSection.appendChild(grid);
            mapSection.appendChild(arrow);

            tempContainer.appendChild(mapSection);

            const legendForPanel = selectedLegends.length > 0 ? selectedLegends[0] : currentSelectedLegend;

            const sidePanel = createExportSidePanel({
                title,
                captureDate: new Date(),
                selectedLegend: legendForPanel,
                getLegendUrl,
                viewType,
                viewportExtent: viewType === 'viewport' ? currentViewportExtent : null,
                minimapImageUrl,
                source: 'Por definir'
            });
            sidePanel.style.left = 'auto';
            sidePanel.style.right = '0';
            sidePanel.style.width = `${sidePanelWidth}px`;
            sidePanel.style.height = `${mapCanvas.height}px`;
            sidePanel.style.fontSize = '22px';
            tempContainer.appendChild(sidePanel);

            document.body.appendChild(tempContainer);

            await new Promise((resolve) => {
                if (mapImage.complete) resolve();
                else mapImage.onload = resolve;
            });

            await waitForImages(sidePanel);

            const finalMapCanvas = await captureElement(tempContainer);

            document.body.removeChild(tempContainer);

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
            if (originalView) {
                restoreView(originalView);
            }
            setIsDownloading(false);
        }
    };

    return {
        downloadMap,
        isDownloading,
        canDownload,
        layersWithLegends,
        currentSelectedLegend,
        selectedLayer
    };
};
