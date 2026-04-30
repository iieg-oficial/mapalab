import { useMapsContext } from '@hooks/useMaps';
import { EXPORT_DIMENSIONS } from '../utils/exportDimensions';
const { MAP_WIDTH, MAP_HEIGHT } = EXPORT_DIMENSIONS;
import { transformExtent } from 'ol/proj';
import { useMapView } from './useMapView';

const applySwipeToggles = (composite, swipeOptions = {}) => {
    if (!composite) return () => {};
    const { swipeBar = true, swipeLabels = true, swipePills = false, pills = [] } = swipeOptions;
    const restore = [];
    const handle = composite.querySelector('[role="separator"]');
    const labels = composite.querySelectorAll('[data-swipe-label]');
    if (!swipeBar && handle) {
        const prev = handle.style.display;
        handle.style.display = 'none';
        restore.push(() => { handle.style.display = prev; });
    }
    if (!swipeLabels) {
        labels.forEach(el => {
            const prev = el.style.display;
            el.style.display = 'none';
            restore.push(() => { el.style.display = prev; });
        });
    }
    const tempPills = [];
    if (swipePills && pills.length) {
        pills.forEach(({ slot, label }) => {
            if (!label) return;
            const isA = slot === 'A';
            const el = document.createElement('div');
            el.className = `absolute top-3 ${isA ? 'left-4' : 'right-4'} px-3 py-1.5 rounded-full border font-garet font-bold text-[12px] z-[2] pointer-events-none ${isA ? 'bg-[#F0EAF3] border-[#5C2472] text-[#5C2472]' : 'bg-[#FFF2E5] border-[#FF8300] text-[#FF8300]'}`;
            el.textContent = label;
            composite.appendChild(el);
            tempPills.push(el);
        });
    }
    return () => {
        tempPills.forEach(el => el.remove());
        restore.forEach(fn => fn());
    };
};

export const useMapCapture = () => {
    const { targetRef, mapRef, compareMode, paneMapRefs } = useMapsContext();
    const { adjustViewToFullState, getActiveMapRef } = useMapView();

    const isSwipe = !!compareMode?.active;
    const getSwipeComposite = () => document.querySelector('[data-swipe-composite="true"]');

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

    const getMapSnapshot = async ({ extent, viewType = 'viewport', mapWidth = MAP_WIDTH, mapHeight = MAP_HEIGHT, captureScale = 1, swipeOptions = null }) => {
        const target = isSwipe ? getSwipeComposite() : targetRef.current;
        const anchorRef = getActiveMapRef();
        if (!target || !anchorRef?.current) return null;

        const additionalRefs = isSwipe && paneMapRefs?.current?.[1]?.current ? [paneMapRefs.current[1].current] : [];
        const allManagedRefs = [anchorRef.current, ...additionalRefs];

        let originalState = null;
        let layerResolutions = [];
        let restoreSwipeToggles = () => {};
        try {
            originalState = {
                width: target.style.width,
                height: target.style.height,
                center: anchorRef.current.getView().getCenter(),
                resolution: anchorRef.current.getView().getResolution()
            };

            const allLayersFlat = allManagedRefs.flatMap(m => getAllLayers(m.getLayers()));
            layerResolutions = allLayersFlat.map(layer => ({ layer, minResolution: layer.getMinResolution() }));
            allLayersFlat.forEach(layer => layer.setMinResolution(0));

            target.style.width = `${mapWidth}px`;
            target.style.height = `${mapHeight}px`;
            allManagedRefs.forEach(m => m.updateSize());

            if (viewType === 'full-state') {
                adjustViewToFullState();
            } else if (extent) {
                const extent3857 = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
                const view = anchorRef.current.getView();
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

            if (isSwipe) restoreSwipeToggles = applySwipeToggles(target, swipeOptions);

            const canvas = await captureMap(captureScale, mapWidth, mapHeight);
            return canvas;
        } catch (error) {
            console.error('Error in getMapSnapshot:', error);
            throw error;
        } finally {
            restoreSwipeToggles();
            layerResolutions.forEach(({ layer, minResolution }) => layer.setMinResolution(minResolution));

            if (originalState) {
                target.style.width = originalState.width;
                target.style.height = originalState.height;
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
