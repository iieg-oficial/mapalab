import { useCallback, useEffect, useRef } from 'react';
import { createEmpty, extend, isEmpty } from 'ol/extent';
import { findAncestorChain } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { buildTargetOverlay, classifyLayer, collectWMSNodes, resolveTargetIds } from '@pages/maps/helpers/layers/aislarCapa';
import { soltarResaltadoYa } from '@pages/maps/helpers/layers/capaResaltada';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';
import { getFitPadding } from '@pages/maps/helpers/mapFit';
import { acotarExtentAMunicipio } from '@pages/maps/helpers/municipioMask';

const PULSE_DURATION_MS = 6000;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const resolveLayerExtent3857 = async (layerId, allLayers) => {
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

const resolveCenterExtent = async (layerId, allLayers) => {
    const direct = await resolveLayerExtent3857(layerId, allLayers);
    if (direct) return direct;
    const chain = findAncestorChain(layerId, allLayers);
    for (const ancestor of chain) {
        if (ancestor.id === layerId) continue;
        const ext = await resolveLayerExtent3857(ancestor.id, allLayers);
        if (ext) return ext;
    }
    return null;
};

export const useLayerSelection = ({ mapRef, paneMapInstances, compareMode, allLayers, municipioModeRef }) => {
    const centerOnLayer = useCallback(async (layerId, fitOptions = {}) => {
        const bruto = await resolveCenterExtent(layerId, allLayers);
        const extent = acotarExtentAMunicipio(bruto, municipioModeRef?.current);
        if (!extent) {
            console.debug('centerOnLayer: sin extent resoluble para', layerId);
            return false;
        }
        const fit = (map) => {
            if (!map) return;
            try {
                const padding = getFitPadding({ mapSize: map.getSize(), ...fitOptions });
                map.getView().fit(extent, { duration: 500, padding, maxZoom: 16 });
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
    }, [allLayers, mapRef, paneMapInstances, compareMode, municipioModeRef]);

    const { pulseLayer, cancelPulse } = useLayerSelectionPulse({ mapRef, paneMapInstances, compareMode, allLayers });

    return { centerOnLayer, pulseLayer, cancelPulse };
};

const useLayerSelectionPulse = ({ mapRef, paneMapInstances, compareMode, allLayers }) => {
    const animationRef = useRef(null);
    const dimmedRef = useRef([]);
    const overlaysRef = useRef([]);
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

        overlaysRef.current.forEach(({ map, layer }) => {
            try {
                map.removeLayer(layer);
            } catch {/**/}
        });

        dimmedRef.current = [];
        overlaysRef.current = [];
        startTimestampRef.current = null;
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    const pulseLayer = useCallback(async (layerId) => {
        soltarResaltadoYa();
        cleanup();

        const targetMaps = compareMode?.active
            ? Object.values(paneMapInstances || {}).filter(Boolean)
            : (mapRef?.current ? [mapRef.current] : []);

        if (targetMaps.length === 0) return false;

        const targetIdSet = resolveTargetIds(layerId, allLayers);

        if (targetIdSet.size === 0) return false;

        const dimmable = [];
        const overlays = [];

        targetMaps.forEach(map => {
            map.getLayers().forEach(olLayer => {
                const info = classifyLayer(olLayer, targetIdSet);

                if (info.role === 'skip' || info.role === 'target') return;

                const originalOpacity = olLayer.getOpacity();

                if (info.role === 'mixed') {
                    const overlay = buildTargetOverlay(olLayer, info.targetIdxs);
                    if (!overlay) return;
                    map.addLayer(overlay);
                    overlays.push({ map, layer: overlay });
                    overlay.getSource().once('imageloadend', () => {
                        dimmable.push({ layer: olLayer, originalOpacity });
                    });
                    return;
                }

                olLayer.setOpacity(0);
                dimmable.push({ layer: olLayer, originalOpacity });
            });
        });

        dimmedRef.current = dimmable;
        overlaysRef.current = overlays;

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

    return { pulseLayer, cancelPulse: cleanup };
};
