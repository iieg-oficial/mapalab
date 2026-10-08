import { useEffect, useMemo, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import { parseResultsFeatures } from '../helpers/featureGeometry';
import { findAncestorChain } from '../helpers/layers/utils/layerHelpers';

const HIGHLIGHT_Z_INDEX = 998;

const HIGHLIGHT_SHAPES = ['area', 'linea', 'off'];
const DEFAULT_HIGHLIGHT_COLOR = 'naranja';
const DEFAULT_HIGHLIGHT_SHAPE = 'area';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const COLOR_PRESETS = {
    morado: {
        stroke: { color: '#5C2472', width: 2.5 },
        areaFill: 'rgba(92, 36, 114, 0.15)',
        point: { radius: 8, strokeWidth: 2 },
    },
    naranja: {
        stroke: { color: '#FF8300', width: 2.5 },
        areaFill: 'rgba(255, 131, 0, 0.18)',
        point: { radius: 8, strokeWidth: 2 },
    },
    sombreado: {
        stroke: { color: 'rgba(46, 67, 114, 0.55)', width: 1 },
        areaFill: 'rgba(46, 67, 114, 0.15)',
        point: { radius: 7, strokeWidth: 1 },
    },
};

const presetForHex = (hex) => ({
    stroke: { color: hex, width: 2.5 },
    areaFill: `${hex}26`,
    point: { radius: 8, strokeWidth: 2 },
});

const TRANSPARENT = 'rgba(0,0,0,0)';
const LAYER_ID_PROP = '_highlightLayerId';

const buildStyle = (color, shape) => {
    const preset = HEX_PATTERN.test(color)
        ? presetForHex(color)
        : (COLOR_PRESETS[color] || COLOR_PRESETS[DEFAULT_HIGHLIGHT_COLOR]);
    const fillColor = shape === 'linea' ? TRANSPARENT : preset.areaFill;
    return new Style({
        stroke: new Stroke({ color: preset.stroke.color, width: preset.stroke.width, lineCap: 'round', lineJoin: 'round' }),
        fill: new Fill({ color: fillColor }),
        image: new CircleStyle({
            radius: preset.point.radius,
            stroke: new Stroke({ color: preset.stroke.color, width: preset.point.strokeWidth }),
            fill: new Fill({ color: fillColor }),
        }),
    });
};

const stylesCache = new Map();
const getCachedStyle = (color, shape) => {
    const key = `${color}|${shape}`;
    if (!stylesCache.has(key)) stylesCache.set(key, buildStyle(color, shape));
    return stylesCache.get(key);
};

const isValidColorValue = (v) => COLOR_PRESETS[v] || HEX_PATTERN.test(v || '');

const resolveLayerHighlight = (layerId, allLayers) => {
    const chain = findAncestorChain(layerId, allLayers);
    let color = null;
    let shape = null;
    for (const node of chain) {
        if (color === null && isValidColorValue(node?.highlightColor)) {
            color = node.highlightColor;
        }
        if (shape === null && HIGHLIGHT_SHAPES.includes(node?.highlightShape)) {
            shape = node.highlightShape;
        }
        if (color !== null && shape !== null) break;
    }
    return {
        color: color || DEFAULT_HIGHLIGHT_COLOR,
        shape: shape || DEFAULT_HIGHLIGHT_SHAPE,
    };
};

export const useFeatureHighlight = ({ mapRef, paneMapRefs, compareMode, selectedFeatureInfo, allLayers }) => {
    const layerRef = useRef(null);
    const sourceRef = useRef(null);
    const attachedMapRef = useRef(null);

    const styleFn = useMemo(() => (feature) => {
        const layerId = feature.get(LAYER_ID_PROP);
        const { color, shape } = resolveLayerHighlight(layerId, allLayers);
        return getCachedStyle(color, shape);
    }, [allLayers]);

    useEffect(() => {
        const detach = () => {
            const prevMap = attachedMapRef.current;
            if (prevMap && layerRef.current) {
                prevMap.removeLayer(layerRef.current);
            }
            attachedMapRef.current = null;
        };

        const skip = !selectedFeatureInfo?.results?.length
            || selectedFeatureInfo?.isPolygonSelection;

        if (skip) {
            if (sourceRef.current) sourceRef.current.clear();
            detach();
            return;
        }

        const filteredResults = (selectedFeatureInfo.results || []).filter(r => {
            return resolveLayerHighlight(r.layerId, allLayers).shape !== 'off';
        });

        if (filteredResults.length === 0) {
            if (sourceRef.current) sourceRef.current.clear();
            detach();
            return;
        }

        const parsed = parseResultsFeatures(filteredResults);
        if (parsed.length === 0) {
            if (sourceRef.current) sourceRef.current.clear();
            detach();
            return;
        }

        const targetMap = compareMode?.active
            ? paneMapRefs?.current?.[0]?.current ?? null
            : mapRef?.current ?? null;

        if (!targetMap) {
            detach();
            return;
        }

        if (!sourceRef.current || !layerRef.current) {
            sourceRef.current = new VectorSource();
            layerRef.current = new VectorLayer({
                source: sourceRef.current,
                style: styleFn,
                zIndex: HIGHLIGHT_Z_INDEX,
            });
        } else {
            layerRef.current.setStyle(styleFn);
        }

        sourceRef.current.clear();
        const features = parsed.map(({ olFeature, layerId }) => {
            olFeature.set(LAYER_ID_PROP, layerId);
            return olFeature;
        });
        sourceRef.current.addFeatures(features);

        if (attachedMapRef.current !== targetMap) {
            if (attachedMapRef.current) {
                attachedMapRef.current.removeLayer(layerRef.current);
            }
            targetMap.addLayer(layerRef.current);
            attachedMapRef.current = targetMap;
        }
    }, [selectedFeatureInfo, compareMode, mapRef, paneMapRefs, allLayers, styleFn]);

    useEffect(() => {
        return () => {
            const prevMap = attachedMapRef.current;
            if (prevMap && layerRef.current) {
                prevMap.removeLayer(layerRef.current);
            }
            attachedMapRef.current = null;
        };
    }, []);
};
