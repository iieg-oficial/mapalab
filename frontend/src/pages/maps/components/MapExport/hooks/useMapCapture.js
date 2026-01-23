import { useMapsContext } from '@hooks/useMaps';
import html2canvas from 'html2canvas';
import { EXPORT_DIMENSIONS } from '../utils/exportDimensions';
import { transformExtent } from 'ol/proj';
import { useMapView } from './useMapView';

export const useMapCapture = () => {
    const { targetRef, mapRef } = useMapsContext();
    const { adjustViewToFullState } = useMapView();

    const prepareScaleControl = (scaleControl) => {
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

    const restoreScaleControl = (scaleControl, originalStyles) => {
        if (!scaleControl || !originalStyles) return;
        scaleControl.style.left = originalStyles.left;
        scaleControl.style.bottom = originalStyles.bottom;
        scaleControl.style.right = originalStyles.right;
        scaleControl.style.top = originalStyles.top;
        scaleControl.style.transform = originalStyles.transform;
    };

    const waitForTilesToLoad = (maxWaitTime = 8000) => {
        return new Promise((resolve) => {
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

    const captureMap = async (scale = 2) => {
        if (!targetRef.current) return null;

        return html2canvas(targetRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale
        });
    };

    const captureElement = async (element, options = {}) => {
        if (!element) return null;

        return html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale: 1,
            logging: false,
            ...options
        });
    };

    const waitForImages = async (container) => {
        const images = container.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));
    };

    const getMapSnapshot = async ({ extent, viewType = 'viewport' }) => {
        if (!targetRef.current || !mapRef.current) return null;

        let originalState = null;
        const { MAP_WIDTH, MAP_HEIGHT } = EXPORT_DIMENSIONS;

        try {
            originalState = {
                width: targetRef.current.style.width,
                height: targetRef.current.style.height,
                center: mapRef.current.getView().getCenter(),
                resolution: mapRef.current.getView().getResolution()
            };

            targetRef.current.style.width = `${MAP_WIDTH}px`;
            targetRef.current.style.height = `${MAP_HEIGHT}px`;
            mapRef.current.updateSize();

            if (viewType === 'full-state') {
                adjustViewToFullState();
            } else if (extent) {
                const extent3857 = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
                mapRef.current.getView().fit(extent3857, { size: [MAP_WIDTH, MAP_HEIGHT] });
            }

            await waitForTilesToLoad();

            const canvas = await captureMap(1);

            return canvas;

        } catch (error) {
            console.error('Error in getMapSnapshot:', error);
            throw error;
        } finally {
            if (originalState) {
                targetRef.current.style.width = originalState.width;
                targetRef.current.style.height = originalState.height;
                mapRef.current.updateSize();

                if (viewType === 'full-state' || extent) {
                    mapRef.current.getView().setCenter(originalState.center);
                    mapRef.current.getView().setResolution(originalState.resolution);
                }
            }
        }
    };

    return {
        prepareScaleControl,
        restoreScaleControl,
        waitForTilesToLoad,
        captureMap,
        captureElement,
        waitForImages,
        getMapSnapshot
    };
};
