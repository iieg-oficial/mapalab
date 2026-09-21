import { useMapsContext } from '@hooks/useMaps';
import { EXPORT_DIMENSIONS } from '../utils/exportDimensions';
const { MAP_WIDTH, MAP_HEIGHT } = EXPORT_DIMENSIONS;
import { transformExtent } from 'ol/proj';
import { useMapView } from './useMapView';
import { composeSwipeCanvas } from '../utils/swipeComposition';
import { MASCARA_Z_INDEX } from '../utils/seleccionDescarga';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Fill, Style } from 'ol/style';

export const useMapCapture = () => {
    const { targetRef, mapRef, compareMode, paneMapRefs } = useMapsContext();
    const { adjustViewToFullState, getActiveMapRef } = useMapView();

    const isSwipe = !!compareMode?.active;
    const getSwipeComposite = () => document.querySelector('[data-swipe-composite="true"]');
    const getPaneTarget = (i) => paneMapRefs?.current?.[i]?.current?.getTargetElement?.() || null;

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
        const refs = isSwipe
            ? [paneMapRefs?.current?.[0]?.current, paneMapRefs?.current?.[1]?.current].filter(Boolean)
            : [mapRef.current].filter(Boolean);
        if (refs.length === 0) return Promise.resolve();
        return Promise.all(refs.map(m => new Promise(resolve => m.once('rendercomplete', resolve))));
    };

    const captureElement = async (element, options = {}) => {
        if (!element) return null;
        const html2canvas = (await import('html2canvas-pro')).default;
        return html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale: 1,
            logging: false,
            ...options
        });
    };

    const captureMap = async (scale = 1, mapWidth = MAP_WIDTH, mapHeight = MAP_HEIGHT) => {
        const target = isSwipe ? getSwipeComposite() : targetRef.current;
        if (!target) return null;
        return captureElement(target, { scale, width: mapWidth, height: mapHeight });
    };

    const captureSwipeComposite = async ({ mapWidth, mapHeight, captureScale, swipeOptions }) => {
        const targetA = getPaneTarget(0);
        const targetB = getPaneTarget(1);
        if (!targetA || !targetB) return null;

        const [canvasA, canvasB] = await Promise.all([
            captureElement(targetA, { scale: captureScale, width: mapWidth, height: mapHeight }),
            captureElement(targetB, { scale: captureScale, width: mapWidth, height: mapHeight }),
        ]);

        const finalWidth = Math.round(mapWidth * captureScale);
        const finalHeight = Math.round(mapHeight * captureScale);
        return composeSwipeCanvas({
            canvasA,
            canvasB,
            width: finalWidth,
            height: finalHeight,
            swipePosition: (compareMode?.swipePosition ?? 0.5) * 100,
            orientation: compareMode?.swipeOrientation || 'vertical',
            swipeOptions: swipeOptions || {},
            labelA: compareMode?.paneA?.label || 'A',
            labelB: compareMode?.paneB?.label || 'B',
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

    const getMapSnapshot = async ({ extent, viewType = 'viewport', mapWidth = MAP_WIDTH, mapHeight = MAP_HEIGHT, captureScale = 1, swipeOptions = null, mascara = null }) => {
        const target = isSwipe ? getSwipeComposite() : targetRef.current;
        const anchorRef = getActiveMapRef();
        if (!target || !anchorRef?.current) return null;

        const additionalRefs = isSwipe && paneMapRefs?.current?.[1]?.current ? [paneMapRefs.current[1].current] : [];
        const allManagedRefs = [anchorRef.current, ...additionalRefs];

        let originalState = null;
        let layerResolutions = [];
        let capaMascara = null;
        const targetsToResize = isSwipe
            ? [target, getPaneTarget(0), getPaneTarget(1)].filter(Boolean)
            : [target];
        try {
            originalState = {
                targetSizes: targetsToResize.map(el => ({ el, width: el.style.width, height: el.style.height })),
                center: anchorRef.current.getView().getCenter(),
                resolution: anchorRef.current.getView().getResolution()
            };

            const allLayersFlat = allManagedRefs.flatMap(m => getAllLayers(m.getLayers()));
            layerResolutions = allLayersFlat.map(layer => ({ layer, minResolution: layer.getMinResolution() }));
            allLayersFlat.forEach(layer => layer.setMinResolution(0));

            targetsToResize.forEach(el => {
                el.style.width = `${mapWidth}px`;
                el.style.height = `${mapHeight}px`;
            });
            allManagedRefs.forEach(m => m.updateSize());

            if (viewType === 'full-state') {
                adjustViewToFullState();
            } else if (extent) {
                const extent3857 = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
                const view = anchorRef.current.getView();
                const extentW = extent3857[2] - extent3857[0];
                const extentH = extent3857[3] - extent3857[1];
                const ajustar = mascara ? Math.max : Math.min;
                const resolution = ajustar(extentW / mapWidth, extentH / mapHeight);
                const center = [
                    (extent3857[0] + extent3857[2]) / 2,
                    (extent3857[1] + extent3857[3]) / 2
                ];
                view.setCenter(center);
                view.setResolution(resolution);
            }

            if (mascara) {
                capaMascara = new VectorLayer({
                    source: new VectorSource({ features: [new Feature(mascara)] }),
                    style: new Style({ fill: new Fill({ color: '#ffffff' }) }),
                    zIndex: MASCARA_Z_INDEX,
                });
                anchorRef.current.addLayer(capaMascara);
            }

            await waitForTilesToLoad();

            if (isSwipe) {
                return await captureSwipeComposite({ mapWidth, mapHeight, captureScale, swipeOptions });
            }
            return await captureMap(captureScale, mapWidth, mapHeight);
        } catch (error) {
            console.error('Error in getMapSnapshot:', error);
            throw error;
        } finally {
            if (capaMascara) anchorRef.current.removeLayer(capaMascara);
            layerResolutions.forEach(({ layer, minResolution }) => layer.setMinResolution(minResolution));

            if (originalState) {
                originalState.targetSizes.forEach(({ el, width, height }) => {
                    el.style.width = width;
                    el.style.height = height;
                });
                allManagedRefs.forEach(m => m.updateSize());

                if (viewType === 'full-state' || extent) {
                    anchorRef.current.getView().setCenter(originalState.center);
                    anchorRef.current.getView().setResolution(originalState.resolution);
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
