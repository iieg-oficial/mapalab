import { useCallback, useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import GeoJSON from 'ol/format/GeoJSON';
import { createEmpty, extend, isEmpty } from 'ol/extent';
import { findLayerById, collectLayersWithWMS } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';
import { fetchLayerFeaturesInBbox } from '@services/layerFeaturesService';

const PULSE_Z_INDEX = 999;
const PULSE_DURATION_MS = 3000;
const PULSE_MAX_OPACITY = 0.5;
const MASK_FEATURE_ID = '__pulse_mask';
const HIGHLIGHT_FEATURE_PROP = '__pulse_highlight';

const geoJSONFormat = new GeoJSON();

const VIEWPORT_PADDING_FACTOR = 4;

const extentToCoords = ([minx, miny, maxx, maxy]) => [
    [minx, miny], [maxx, miny], [maxx, maxy], [minx, maxy], [minx, miny],
];

const reverseCoords = (coords) => coords.slice().reverse();

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const maskStyle = new Style({
    fill: new Fill({ color: 'rgba(15, 23, 42, 1)' }),
    stroke: null,
});

const highlightStyle = new Style({
    stroke: new Stroke({ color: '#5C2472', width: 2.5, lineCap: 'round', lineJoin: 'round' }),
    fill: new Fill({ color: 'rgba(92, 36, 114, 0.45)' }),
    image: new CircleStyle({
        radius: 7,
        stroke: new Stroke({ color: '#5C2472', width: 2 }),
        fill: new Fill({ color: 'rgba(92, 36, 114, 0.6)' }),
    }),
});

const buildPulseLayers = () => {
    const maskSource = new VectorSource();
    const maskLayer = new VectorLayer({
        source: maskSource,
        zIndex: PULSE_Z_INDEX,
        style: maskStyle,
    });
    maskLayer.setOpacity(0);

    const highlightSource = new VectorSource();
    const highlightLayer = new VectorLayer({
        source: highlightSource,
        zIndex: PULSE_Z_INDEX + 1,
        style: highlightStyle,
    });
    highlightLayer.setOpacity(0);

    return { maskSource, maskLayer, highlightSource, highlightLayer };
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

    return [mask];
};

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

const fetchLayerHighlightFeatures = async (layerId, allLayers, viewExtent) => {
    const nodesWithWMS = collectWMSNodes(layerId, allLayers);
    if (!nodesWithWMS.length) return null;
    const collections = await Promise.all(
        nodesWithWMS.map(n => fetchLayerFeaturesInBbox(n.wmsConfig, viewExtent))
    );
    const olFeatures = [];
    for (const fc of collections) {
        if (!fc?.features?.length) continue;
        try {
            const parsed = geoJSONFormat.readFeatures(fc, {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:3857',
            });
            for (const f of parsed) {
                if (f.getGeometry()) {
                    f.set(HIGHLIGHT_FEATURE_PROP, true);
                    olFeatures.push(f);
                }
            }
        } catch {
            // skip malformed collection
        }
    }
    return olFeatures.length ? olFeatures : null;
};

const computeFeaturesExtent = (features) => {
    const union = createEmpty();
    for (const f of features) {
        const g = f.getGeometry();
        if (g) extend(union, g.getExtent());
    }
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
    const layersRef = useRef(null);
    const animationRef = useRef(null);
    const attachedMapsRef = useRef([]);
    const startTimestampRef = useRef(null);
    const nowFn = useRef(() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

    const cleanup = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        const refs = layersRef.current;
        if (refs) {
            refs.maskSource.clear();
            refs.highlightSource.clear();
            refs.maskLayer.setOpacity(0);
            refs.highlightLayer.setOpacity(0);
        }
        attachedMapsRef.current.forEach(map => {
            if (!map || !refs) return;
            map.removeLayer(refs.maskLayer);
            map.removeLayer(refs.highlightLayer);
        });
        attachedMapsRef.current = [];
        startTimestampRef.current = null;
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    const pulseLayer = useCallback(async (layerId) => {
        cleanup();

        const targetMaps = compareMode?.active
            ? Object.values(paneMapInstances || {}).filter(Boolean)
            : (mapRef?.current ? [mapRef.current] : []);
        if (targetMaps.length === 0) return false;

        const viewExtent = targetMaps[0].getView().calculateExtent(targetMaps[0].getSize() || [800, 600]);

        const highlightFeatures = await fetchLayerHighlightFeatures(layerId, allLayers, viewExtent);

        let maskHoleExtent = highlightFeatures ? computeFeaturesExtent(highlightFeatures) : null;
        if (!maskHoleExtent) {
            maskHoleExtent = await resolveLayerExtent3857(layerId, allLayers);
        }
        if (!maskHoleExtent || maskHoleExtent.length !== 4) return false;

        if (!layersRef.current) {
            layersRef.current = buildPulseLayers();
        }
        const { maskSource, maskLayer, highlightSource, highlightLayer } = layersRef.current;

        const maskFeatures = buildFeatures(maskHoleExtent, viewExtent);
        maskSource.clear();
        maskSource.addFeatures(maskFeatures);

        highlightSource.clear();
        if (highlightFeatures?.length) {
            highlightSource.addFeatures(highlightFeatures);
        }

        targetMaps.forEach(map => {
            map.addLayer(maskLayer);
            map.addLayer(highlightLayer);
        });
        attachedMapsRef.current = targetMaps;

        startTimestampRef.current = nowFn.current();

        const step = () => {
            const elapsed = nowFn.current() - startTimestampRef.current;
            const progress = Math.min(elapsed / PULSE_DURATION_MS, 1);
            const wave = Math.sin(easeInOut(progress) * Math.PI);
            maskLayer.setOpacity(wave * PULSE_MAX_OPACITY);
            highlightLayer.setOpacity(wave);

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
