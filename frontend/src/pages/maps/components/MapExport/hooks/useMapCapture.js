import { useMapsContext } from '@hooks/useMaps';
import html2canvas from 'html2canvas';
import { EXPORT_DIMENSIONS } from '../utils/exportDimensions';
const { MAP_WIDTH, MAP_HEIGHT } = EXPORT_DIMENSIONS;
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

    const waitForTilesToLoad = () => {
        return new Promise((resolve) => {
            if (!mapRef.current) {
                resolve();
                return;
            }
            mapRef.current.once('rendercomplete', resolve);
        });
    };

    const captureMap = async (scale = 1, mapWidth = MAP_WIDTH, mapHeight = MAP_HEIGHT) => {
        if (!targetRef.current) return null;

        return html2canvas(targetRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale,
            width: mapWidth,
            height: mapHeight
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

    const getAllLayers = (layerCollection) => {
        const result = [];
        layerCollection.forEach(layer => {
            if (typeof layer.getLayers === 'function') {
                result.push(...getAllLayers(layer.getLayers()));
            } else {
                result.push(layer);
            }
        });
        return result;
    };

    const getMapSnapshot = async ({ extent, viewType = 'viewport', mapWidth = MAP_WIDTH, mapHeight = MAP_HEIGHT, captureScale = 1 }) => {
        if (!targetRef.current || !mapRef.current) return null;

        let originalState = null;
        let layerResolutions = [];
        try {
            originalState = {
                width: targetRef.current.style.width,
                height: targetRef.current.style.height,
                center: mapRef.current.getView().getCenter(),
                resolution: mapRef.current.getView().getResolution()
            };

            const allLayers = getAllLayers(mapRef.current.getLayers());
            layerResolutions = allLayers.map(layer => ({
                layer,
                minResolution: layer.getMinResolution()
            }));
            allLayers.forEach(layer => layer.setMinResolution(0));

            targetRef.current.style.width = `${mapWidth}px`;
            targetRef.current.style.height = `${mapHeight}px`;
            mapRef.current.updateSize();

            if (viewType === 'full-state') {
                adjustViewToFullState();
            } else if (extent) {
                const extent3857 = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
                const view = mapRef.current.getView();
                const extentW = extent3857[2] - extent3857[0];
                const extentH = extent3857[3] - extent3857[1];
                const resolution = Math.min(extentW / mapWidth, extentH / mapHeight);
                const center = [
                    (extent3857[0] + extent3857[2]) / 2,
                    (extent3857[1] + extent3857[3]) / 2
                ];
                view.setCenter(center);
                view.setResolution(resolution);
            }

            await waitForTilesToLoad();

            const canvas = await captureMap(captureScale, mapWidth, mapHeight);

            return canvas;

        } catch (error) {
            console.error('Error in getMapSnapshot:', error);
            throw error;
        } finally {
            layerResolutions.forEach(({ layer, minResolution }) => layer.setMinResolution(minResolution));

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
