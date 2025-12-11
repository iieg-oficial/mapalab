import { useState, useContext, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from './useWMSLegend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import coordinateGrid from '../utils/coordinateGrid';
import layoutHeader from '../utils/layoutHeader';
import northArrow from '../utils/northArrow';
import createExportMapFooter from '../components/ExportMapFooter';
import createExportLegendsLayout from '../components/ExportLegendsLayout';
import IIEG_Logo from '@assets/logos/iieg_large.svg';
import { layers as allLayers, findLayerById } from '../helpers/layers/index';
import { JALISCO_BOUNDS } from '../helpers/wmsConfig';
import { fromLonLat } from 'ol/proj';
import { boundingExtent } from 'ol/extent';

export const useMapDownload = () => {
    const { targetRef, mapRef } = useMapsContext();
    const { getLegendUrl, hasLegend } = useWMSLegend();
    const { activeLayerIds, getFilter, selectedLayer, groupedActiveLayers } = useContext(MapsContext);
    const [isDownloading, setIsDownloading] = useState(false);

    const activeLayers = useMemo(() => activeLayerIds
        .map(id => findLayerById(id, allLayers))
        .filter(Boolean), [activeLayerIds]);

    const layersWithLegends = useMemo(() => {
        return groupedActiveLayers.filter(layer => hasLegend(layer));
    }, [groupedActiveLayers, hasLegend]);

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
        scaleControl.style.right = '50px';
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

    const getFilterDates = () => {
        const filters = activeLayerIds
            .map(id => {
                const filter = getFilter(id);
                return filter;
            })
            .filter(Boolean);

        return filters.length > 0 ? filters.join(' | ') : null;
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

    const downloadMap = async (format = 'png', selectedLegends = [], viewType = 'viewport') => {
        if (!targetRef.current || !canDownload || isDownloading) return;

        setIsDownloading(true);
        const scaleControl = targetRef.current.querySelector('.ol-scale-line');
        const originalStyles = prepareMapForCapture(scaleControl);

        let originalView = null;
        if (viewType === 'full-state') {
            originalView = adjustViewToFullState();
        }

        try {
            await new Promise(resolve => setTimeout(resolve, viewType === 'full-state' ? 300 : 100));

            const mapCanvas = await html2canvas(targetRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 2
            });

            restoreMapStyles(scaleControl, originalStyles);

            const tempContainer = document.createElement('div');
            Object.assign(tempContainer.style, {
                position: 'absolute',
                left: '-9999px',
                width: `${mapCanvas.width / 2}px`,
                height: `${mapCanvas.height / 2}px`
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

            const header = layoutHeader(IIEG_Logo);
            const arrow = northArrow();
            const grid = coordinateGrid(mapCanvas.width / 2, mapCanvas.height / 2);

            tempContainer.appendChild(mapImage);
            tempContainer.appendChild(grid);
            tempContainer.appendChild(header);
            tempContainer.appendChild(arrow);

            if (format !== 'pdf') {
                const filterDates = getFilterDates();
                const footer = createExportMapFooter(selectedLegends, getLegendUrl, filterDates);
                tempContainer.appendChild(footer);
            }

            document.body.appendChild(tempContainer);

            await new Promise((resolve) => {
                if (mapImage.complete) resolve();
                else mapImage.onload = resolve;
            });

            const finalMapCanvas = await html2canvas(tempContainer, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 2,
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
        selectedLayer
    };
};
