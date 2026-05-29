import { useCallback, useEffect, useRef } from 'react';
import { createEmpty, extend, isEmpty } from 'ol/extent';
import { findLayerById, collectLayersWithWMS } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';

const PULSE_Z_INDEX = 1000;
const PULSE_DURATION_MS = 6000;
const DIM_FACTOR = 1;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const collectWMSNodes = (layerId, allLayers) => {
    const node = findLayerById(layerId, allLayers);
    if (!node) return [];
    return node.wmsConfig ? [node] : collectLayersWithWMS(node);
};

export const resolveLayerExtent3857 = async (layerId, allLayers) => {
    if (!layerId) return null;
    const nodesWithWMS = collectWMSNodes(layerId, allLayers);
    if (!nodesWithWMS.length) return null;
    const extents = await Promise.all(nodesWithWMS.map(n => getLayerExtent3857(n.wmsConfig)));
    const valid = extents.filter(Boolean);
    if (!valid.length) return null;
    const union = createEmpty();
    for (const ext of valid) extend(union, ext);
    return isEmpty(union) ? null : union;
};

const findDimmableLayers = (map, targetIdSet) => {
    const dimmable = [];
    map.getLayers().forEach(layer => {
        const merged = layer.get('mergedLayers');
        if (!merged) return;
        const containsTarget = merged.some(m =>
            (m.subLayers || []).some(sub => targetIdSet.has(sub.id))
        );
        if (!containsTarget) {
            dimmable.push({ layer, originalOpacity: layer.getOpacity() });
        }
    });
    return dimmable;
};

const resolveTargetIds = (layerId, allLayers) => {
    const nodes = collectWMSNodes(layerId, allLayers);
    return new Set(nodes.map(n => n.id));
};

export const useLayerSelection = ({ mapRef, paneMapInstances, compareMode, allLayers }) => {
    const centerOnLayer = useCallback(async (layerId) => {
        const extent = await resolveLayerExtent3857(layerId, allLayers);
        if (!extent) return false;
        const fit = (map) => {
            if (!map) return;
            try {
                const size = map.getSize();
                const shortSide = size ? Math.min(size[0], size[1]) : 800;
                const pad = Math.round(shortSide * 0.08);
                map.getView().fit(extent, { duration: 500, padding: [pad, pad, pad, pad], maxZoom: 16 });
            } catch (err) {
                console.debug('No se pudo hacer fit a la capa', err);
            }
        };
        if (compareMode?.active) {
            Object.values(paneMapInstances || {}).forEach(fit);
        } else {
            fit(mapRef.current);
        }
        return true;
    }, [allLayers, mapRef, paneMapInstances, compareMode]);

    const pulseLayer = useLayerSelectionPulse({ mapRef, paneMapInstances, compareMode, allLayers });

    return { centerOnLayer, pulseLayer };
};

const useLayerSelectionPulse = ({ mapRef, paneMapInstances, compareMode, allLayers }) => {
    const animationRef = useRef(null);
    const dimmedRef = useRef([]);
    const startTimestampRef = useRef(null);
    const nowFn = useRef(() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

    const cleanup = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        dimmedRef.current.forEach(({ layer, originalOpacity }) => {
            try {
                layer.setOpacity(originalOpacity);
            } catch {/**/}
        });

        dimmedRef.current = [];
        startTimestampRef.current = null;
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    const pulseLayer = useCallback(async (layerId) => {
        cleanup();

        const targetMaps = compareMode?.active
            ? Object.values(paneMapInstances || {}).filter(Boolean)
            : (mapRef?.current ? [mapRef.current] : []);

        if (targetMaps.length === 0) return false;

        const targetIdSet = resolveTargetIds(layerId, allLayers);
        if (targetIdSet.size === 0) return false;

        const dimmable = [];
        targetMaps.forEach(map => dimmable.push(...findDimmableLayers(map, targetIdSet)));

        dimmedRef.current = dimmable;

        dimmable.forEach(({ layer: olLayer }) => {
            olLayer.setOpacity(0);
        });

        startTimestampRef.current = nowFn.current();

        const step = () => {
            const elapsed = nowFn.current() - startTimestampRef.current;
            const progress = Math.min(elapsed / PULSE_DURATION_MS, 1);

            const fade = easeInOut(progress);

            dimmable.forEach(({ layer: olLayer, originalOpacity }) => {
                olLayer.setOpacity(originalOpacity * fade);
            });

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(step);
            } else {
                cleanup();
            }
        };

        animationRef.current = requestAnimationFrame(step);

        return true;
    }, [allLayers, mapRef, paneMapInstances, compareMode, cleanup]);

    return pulseLayer;
};
