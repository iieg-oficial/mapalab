import { useCallback, useEffect, useRef } from 'react';
import { createEmpty, extend, isEmpty } from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { findLayerById, collectLayersWithWMS, findAncestorChain } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';
import { getFitPadding } from '@pages/maps/helpers/mapFit';
import { acotarExtentAMunicipio } from '@pages/maps/helpers/municipioMask';

const PULSE_DURATION_MS = 6000;
const OVERLAY_Z_INDEX = 1_000_000;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const collectWMSNodes = (layerId, allLayers) => {
    const node = findLayerById(layerId, allLayers);
    if (!node) return [];
    return node.wmsConfig ? [node] : collectLayersWithWMS(node);
};

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

const classifyLayer = (olLayer, targetIdSet) => {
    const mergedLayers = olLayer.get('mergedLayers');

    if (Array.isArray(mergedLayers)) {
        const targetIdxs = [];
        mergedLayers.forEach((entry, i) => {
            if ((entry.subLayers || []).some(sub => targetIdSet.has(sub.id))) targetIdxs.push(i);
        });
        if (targetIdxs.length === 0) return { role: 'other' };
        if (targetIdxs.length === mergedLayers.length) return { role: 'target' };
        return { role: 'mixed', targetIdxs };
    }

    const layerId = olLayer.get('layerId');
    if (layerId) return targetIdSet.has(layerId) ? { role: 'target' } : { role: 'other' };

    return { role: 'skip' };
};

const buildTargetOverlay = (hostLayer, targetIdxs) => {
    const source = hostLayer.getSource?.();
    const mergedLayers = hostLayer.get('mergedLayers');
    if (!source || !Array.isArray(mergedLayers)) return null;

    const params = source.getParams ? source.getParams() : null;
    const url = source.getUrl ? source.getUrl() : null;
    if (!params || !url) return null;

    const split = (value, sep) => (value == null ? null : String(value).split(sep));
    const layersArr = split(params.LAYERS, ',');
    if (!layersArr || layersArr.length !== mergedLayers.length) return null;

    const pick = (arr) => (arr && arr.length === mergedLayers.length ? targetIdxs.map(i => arr[i]) : null);

    const overlayParams = { ...params, LAYERS: pick(layersArr).join(',') };
    const styles = pick(split(params.STYLES, ','));
    if (styles) overlayParams.STYLES = styles.join(',');
    const cql = pick(split(params.CQL_FILTER, ';'));
    if (cql) overlayParams.CQL_FILTER = cql.join(';');

    const overlaySource = new ImageWMS({
        url,
        params: overlayParams,
        ratio: 1.5,
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
    });

    return new ImageLayer({ source: overlaySource, opacity: 1, zIndex: OVERLAY_Z_INDEX });
};

const resolveTargetIds = (layerId, allLayers) => {
    const nodes = collectWMSNodes(layerId, allLayers);
    return new Set(nodes.map(n => n.id));
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
