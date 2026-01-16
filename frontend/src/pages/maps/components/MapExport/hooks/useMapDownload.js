import { useState, useContext, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '../../../hooks/useWMSLegend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import coordinateGrid from '../utils/coordinateGrid';
import northArrow from '../utils/northArrow';
import createExportSidePanel from '../ExportSidePanel';
import createExportLegendsLayout from '../ExportLegendsLayout';
import { layers as allLayers, findLayerById } from '../../../helpers/layers/index';
import { JALISCO_BOUNDS } from '../../../helpers/wmsConfig';
import { fromLonLat, transformExtent } from 'ol/proj';
import { boundingExtent } from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';

export const useMapDownload = () => {
    const { targetRef, mapRef } = useMapsContext();
    const { getLegendUrl, hasLegend } = useWMSLegend();
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

    const prepareMapForCapture = (scaleControl) => {
        if (!scaleControl) return null;

        const originalStyles = {
            left: scaleControl.style.left,
            bottom: scaleControl.style.bottom,
            right: scaleControl.style.right,
            top: scaleControl.style.top,
            transform: scaleControl.style.transform
        };

        scaleControl.style.left = 'auto';
        scaleControl.style.bottom = '15px';
        scaleControl.style.right = '330px';
        scaleControl.style.top = 'auto';
        scaleControl.style.transform = 'scale(1.5)';
        scaleControl.style.transformOrigin = 'bottom right';

        return originalStyles;
    };

    const restoreMapStyles = (scaleControl, originalStyles) => {
        if (!scaleControl || !originalStyles) return;
        scaleControl.style.left = originalStyles.left;
        scaleControl.style.bottom = originalStyles.bottom;
        scaleControl.style.right = originalStyles.right;
        scaleControl.style.top = originalStyles.top;
        scaleControl.style.transform = originalStyles.transform;
    };

    const getViewportExtent = () => {
        if (!mapRef?.current) return null;
        const view = mapRef.current.getView();
        const extent = view.calculateExtent(mapRef.current.getSize());
        return transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    };

    const adjustViewToFullState = () => {
        if (!mapRef.current) return null;

        const view = mapRef.current.getView();
        const originalCenter = view.getCenter();
        const originalZoom = view.getZoom();

        const [minLon, minLat, maxLon, maxLat] = JALISCO_BOUNDS.coords;
        const extent = boundingExtent([
            fromLonLat([minLon, minLat]),
            fromLonLat([maxLon, maxLat])
        ]);

        view.fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 0
        });

        return { center: originalCenter, zoom: originalZoom };
    };

    const restoreView = (originalView) => {
        if (!mapRef.current || !originalView) return;

        const view = mapRef.current.getView();
        view.setCenter(originalView.center);
        view.setZoom(originalView.zoom);
    };

    const waitForMapTilesToLoad = () => {
        return new Promise((resolve) => {
            const maxWaitTime = 8000;
            const startTime = Date.now();

            const checkLoading = () => {
                const loadingElement = document.querySelector('.animate-spin');
                const isLoading = loadingElement !== null;

                if (!isLoading || Date.now() - startTime > maxWaitTime) {
                    setTimeout(resolve, 500);
                } else {
                    setTimeout(checkLoading, 200);
                }
            };

            setTimeout(checkLoading, 1000);
        });
    };

    const hideNonLimitLayers = () => {
        if (!mapRef.current) return [];

        const hiddenLayers = [];
        const limitLayerIds = ['limite_iieg', 'limite_inegi'];
        const olLayers = mapRef.current.getLayers().getArray();

        olLayers.forEach(layer => {
            const layerId = layer.get('layerId') || layer.get('id');
            const zIndex = layer.getZIndex();
            const isTileBaseMap = zIndex === -1;
            const isLimitLayer = layerId && limitLayerIds.includes(layerId);

            if (!isTileBaseMap && !isLimitLayer && layer.getVisible()) {
                hiddenLayers.push(layer);
                layer.setVisible(false);
            }
        });

        return hiddenLayers;
    };

    const restoreLayers = (hiddenLayers) => {
        hiddenLayers.forEach(layer => {
            layer.setVisible(true);
        });
    };

    const createTemporaryLimitLayer = () => {
        if (!mapRef.current) return null;

        const limitLayerName = 'general:limite_iieg';
        const wmsSource = new ImageWMS({
            url: `${import.meta.env.VITE_GEOSERVER_URL}general/wms`,
            params: {
                'LAYERS': limitLayerName,
                'FORMAT': 'image/png',
                'TRANSPARENT': true,
                'VERSION': '1.1.0',
                'SRS': 'EPSG:6368'
            },
            ratio: 1,
            serverType: 'geoserver',
            crossOrigin: 'anonymous'
        });

        const limitLayer = new ImageLayer({
            source: wmsSource,
            visible: true,
            zIndex: 1000
        });

        mapRef.current.addLayer(limitLayer);
        return limitLayer;
    };

    const removeTemporaryLayer = (layer) => {
        if (mapRef.current && layer) {
            mapRef.current.removeLayer(layer);
        }
    };

    const generateMinimapImage = async () => {
        if (!mapRef.current || !targetRef.current) return null;

        const hiddenLayers = hideNonLimitLayers();
        const tempLimitLayer = createTemporaryLimitLayer();
        await new Promise(resolve => setTimeout(resolve, 500));

        const originalView = adjustViewToFullState();
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const fullCanvas = await html2canvas(targetRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 1
            });

            const targetWidth = 515;
            const targetHeight = 430;

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = targetWidth;
            croppedCanvas.height = targetHeight;
            const ctx = croppedCanvas.getContext('2d');

            const aspectRatio = targetWidth / targetHeight;
            const canvasAspectRatio = fullCanvas.width / fullCanvas.height;

            let sourceX, sourceY, sourceW, sourceH;

            if (canvasAspectRatio > aspectRatio) {
                sourceH = fullCanvas.height;
                sourceW = sourceH * aspectRatio;
                sourceX = (fullCanvas.width - sourceW) / 2;
                sourceY = 0;
            } else {
                sourceW = fullCanvas.width;
                sourceH = sourceW / aspectRatio;
                sourceX = 0;
                sourceY = (fullCanvas.height - sourceH) / 2;
            }

            ctx.drawImage(
                fullCanvas,
                sourceX, sourceY, sourceW, sourceH,
                0, 0, targetWidth, targetHeight
            );

            return croppedCanvas.toDataURL('image/png');
        } finally {
            restoreLayers(hiddenLayers);
            removeTemporaryLayer(tempLimitLayer);
            restoreView(originalView);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };

    const downloadMap = async (format = 'png', selectedLegends = [], viewType = 'viewport', title = 'Mapa') => {
        if (!targetRef.current || !canDownload || isDownloading) return;

        setIsDownloading(true);
        const scaleControl = targetRef.current.querySelector('.ol-scale-line');
        const originalStyles = prepareMapForCapture(scaleControl);

        let currentViewportExtent = getViewportExtent();
        let originalView = null;

        try {
            const minimapImageUrl = await generateMinimapImage();

            if (viewType === 'full-state') {
                originalView = adjustViewToFullState();
                await waitForMapTilesToLoad();
            } else {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const extent = getViewportExtent();

            const mapCanvas = await html2canvas(targetRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 2
            });

            restoreMapStyles(scaleControl, originalStyles);

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

            const panelImages = sidePanel.querySelectorAll('img');
            await Promise.all(Array.from(panelImages).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const finalMapCanvas = await html2canvas(tempContainer, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 1,
                logging: false
            });

            document.body.removeChild(tempContainer);

            if (format === 'pdf') {
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'letter'
                });

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                const calculateFittedDimensions = (imgWidth, imgHeight, maxWidth, maxHeight) => {
                    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                    return {
                        width: imgWidth * ratio,
                        height: imgHeight * ratio
                    };
                };

                const mapDims = calculateFittedDimensions(finalMapCanvas.width, finalMapCanvas.height, pageWidth, pageHeight);
                const mapX = (pageWidth - mapDims.width) / 2;
                const mapY = (pageHeight - mapDims.height) / 2;

                pdf.addImage(finalMapCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', mapX, mapY, mapDims.width, mapDims.height);

                if (selectedLegends.length > 0) {
                    const legendsContainer = createExportLegendsLayout(selectedLegends, getLegendUrl);
                    document.body.appendChild(legendsContainer);

                    const legendImages = legendsContainer.querySelectorAll('img');
                    await Promise.all(Array.from(legendImages).map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(resolve => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                    }));

                    const legendsCanvas = await html2canvas(legendsContainer, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        scale: 2,
                        logging: false
                    });

                    document.body.removeChild(legendsContainer);

                    pdf.addPage('letter', 'landscape');

                    const legendDims = calculateFittedDimensions(legendsCanvas.width, legendsCanvas.height, pageWidth, pageHeight);
                    const legendX = (pageWidth - legendDims.width) / 2;
                    const legendY = (pageHeight - legendDims.height) / 2;

                    pdf.addImage(legendsCanvas.toDataURL('image/jpeg', 0.9), 'JPEG', legendX, legendY, legendDims.width, legendDims.height);
                }

                pdf.save('mapa.pdf');
            } else {
                const link = document.createElement('a');
                link.download = `mapa.${format}`;
                link.href = finalMapCanvas.toDataURL(`image/${format}`, 0.9);
                link.click();
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
