import { useCallback, useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { createEmpty, extend, isEmpty } from 'ol/extent';
import { findLayerById, collectLayersWithWMS } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';

const PULSE_Z_INDEX = 999;
const PULSE_DURATION_MS = 1600;
const MASK_FEATURE_ID = '__pulse_mask';
const RING_FEATURE_ID = '__pulse_ring';

const VIEWPORT_PADDING_FACTOR = 4;

const extentToCoords = ([minx, miny, maxx, maxy]) => [
    [minx, miny], [maxx, miny], [maxx, maxy], [minx, maxy], [minx, miny],
];

const reverseCoords = (coords) => coords.slice().reverse();

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const buildPulseLayer = () => {
    const source = new VectorSource();
    const layer = new VectorLayer({
        source,
        zIndex: PULSE_Z_INDEX,
        style: (feature) => {
            if (feature.getId() === MASK_FEATURE_ID) {
                return new Style({
                    fill: new Fill({ color: 'rgba(15, 23, 42, 0.45)' }),
                    stroke: null,
                });
            }
            return new Style({
                stroke: new Stroke({ color: '#5C2472', width: 3, lineCap: 'round' }),
                fill: new Fill({ color: 'rgba(92, 36, 114, 0.18)' }),
            });
        },
    });
    layer.setOpacity(0);
    return { source, layer };
};

const buildFeatures = (extent, viewExtent) => {
    const layerCoords = extentToCoords(extent);
    const [vminx, vminy, vmaxx, vmaxy] = viewExtent;
    const w = vmaxx - vminx;
    const h = vmaxy - vminy;
    const outer = [
        [vminx - w * VIEWPORT_PADDING_FACTOR, vminy - h * VIEWPORT_PADDING_FACTOR],
        [vmaxx + w * VIEWPORT_PADDING_FACTOR, vminy - h * VIEWPORT_PADDING_FACTOR],
        [vmaxx + w * VIEWPORT_PADDING_FACTOR, vmaxy + h * VIEWPORT_PADDING_FACTOR],
        [vminx - w * VIEWPORT_PADDING_FACTOR, vmaxy + h * VIEWPORT_PADDING_FACTOR],
        [vminx - w * VIEWPORT_PADDING_FACTOR, vminy - h * VIEWPORT_PADDING_FACTOR],
    ];
    const inner = reverseCoords(layerCoords);

    const mask = new Feature({ geometry: new Polygon([outer, inner]) });
    mask.setId(MASK_FEATURE_ID);

    const ring = new Feature({ geometry: new Polygon([layerCoords]) });
    ring.setId(RING_FEATURE_ID);

    return [mask, ring];
};

export const resolveLayerExtent3857 = async (layerId, allLayers) => {
    if (!layerId) return null;
    const node = findLayerById(layerId, allLayers);
    if (!node) return null;
    const nodesWithWMS = node.wmsConfig ? [node] : collectLayersWithWMS(node);
    if (!nodesWithWMS.length) return null;
    const extents = await Promise.all(nodesWithWMS.map(n => getLayerExtent3857(n.wmsConfig)));
    const valid = extents.filter(Boolean);
    if (!valid.length) return null;
    const union = createEmpty();
    for (const ext of valid) extend(union, ext);
    return isEmpty(union) ? null : union;
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
    const layerRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);
    const attachedMapsRef = useRef([]);
    const startTimestampRef = useRef(null);
    const nowFn = useRef(() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

    const cleanup = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (sourceRef.current) sourceRef.current.clear();
        if (layerRef.current) layerRef.current.setOpacity(0);
        attachedMapsRef.current.forEach(map => {
            if (map && layerRef.current) map.removeLayer(layerRef.current);
        });
        attachedMapsRef.current = [];
        startTimestampRef.current = null;
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    const pulseLayer = useCallback(async (layerId) => {
        const extent = await resolveLayerExtent3857(layerId, allLayers);
        if (!extent || extent.length !== 4) return false;

        cleanup();

        const targetMaps = compareMode?.active
            ? Object.values(paneMapInstances || {}).filter(Boolean)
            : (mapRef?.current ? [mapRef.current] : []);
        if (targetMaps.length === 0) return false;

        if (!sourceRef.current || !layerRef.current) {
            const built = buildPulseLayer();
            sourceRef.current = built.source;
            layerRef.current = built.layer;
        }

        const viewExtent = targetMaps[0].getView().calculateExtent(targetMaps[0].getSize() || [800, 600]);
        const features = buildFeatures(extent, viewExtent);
        sourceRef.current.clear();
        sourceRef.current.addFeatures(features);

        targetMaps.forEach(map => map.addLayer(layerRef.current));
        attachedMapsRef.current = targetMaps;

        startTimestampRef.current = nowFn.current();

        const step = () => {
            const elapsed = nowFn.current() - startTimestampRef.current;
            const progress = Math.min(elapsed / PULSE_DURATION_MS, 1);
            const wave = Math.sin(easeInOut(progress) * Math.PI);
            layerRef.current.setOpacity(wave);

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
