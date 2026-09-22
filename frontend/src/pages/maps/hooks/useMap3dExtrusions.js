import { useEffect, useRef, useState } from 'react';
import { unByKey } from 'ol/Observable';
import { countVectorFeatures, fetchVectorFeatures } from '@services/vectorLayerService';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { isVectorService, VECTOR_FEATURE_LIMIT } from '@pages/maps/helpers/serviceMode';
import { cqlSegmentFor } from '@pages/maps/helpers/view3d';
import { colorExpression, numericProperties, parseLegendRules, quantileClasses } from '@pages/maps/helpers/extrusionRules';
import { toLonLatCollection } from '@pages/maps/helpers/olToGeojson';
import {
    extrusionLayer, managedIds, maxOf, removeGeojson, replaceLayers, upsertGeojson,
} from '@pages/maps/helpers/map3dLayerSpecs';

const PREFIX = 'ext-';

const paramsFor = (olMap, layerId) => {
    const layer = olMap.getLayers().getArray().find(candidate => (candidate.get('mergedLayers') || [])
        .some(entry => entry.subLayers?.some(sub => sub.id === layerId)));
    return layer ? layer.getSource().getParams() : null;
};

const resolveStyle = (collection, legendJson) => {
    const rules = parseLegendRules(legendJson);
    if (rules && collection.features.some(feature => feature.properties?.[rules.property] !== undefined)) {
        return { property: rules.property, color: colorExpression(rules.property, rules.classes, rules.nullColor || '#d9d9d9') };
    }
    const property = numericProperties(collection.features)[0];
    if (!property) return null;
    const classes = quantileClasses(collection.features.map(feature => Number(feature.properties?.[property])));
    return { property, color: colorExpression(property, classes) };
};

export const loadExtrusion = async ({ wmsConfig, cqlFilter, signal, getLegendJson, layerId }) => {
    const total = await countVectorFeatures(wmsConfig, cqlFilter, signal);
    if (total !== null && total > VECTOR_FEATURE_LIMIT) return { status: 'too_large' };
    const [json, legendJson] = await Promise.all([
        fetchVectorFeatures(wmsConfig, cqlFilter, signal),
        getLegendJson({ id: layerId }),
    ]);
    const collection = toLonLatCollection(json);
    const style = resolveStyle(collection, legendJson);
    if (!style) return { status: 'no_value' };
    return { status: 'ready', collection, style: { ...style, maxValue: maxOf(collection.features, style.property) } };
};

export const useMap3dExtrusions = (map, olMapRef, { extrudedIds, allLayers, getServiceMode, getLegendJson, reportExtrusion, alturaColumnas = 1 }) => {
    const cacheRef = useRef(new Map());
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const olMap = olMapRef.current;
        if (!map || !olMap) return undefined;
        let keys = [];
        const bump = () => setRevision(value => value + 1);
        const watch = () => {
            unByKey(keys);
            keys = olMap.getLayers().getArray()
                .filter(layer => layer.get('mergedLayers'))
                .map(layer => layer.getSource().on('change', bump));
        };
        const collectionKeys = olMap.getLayers().on(['add', 'remove'], () => { watch(); bump(); });
        watch();
        return () => { unByKey(keys); unByKey(collectionKeys); };
    }, [map, olMapRef]);

    useEffect(() => {
        const olMap = olMapRef.current;
        if (!map || !olMap) return undefined;
        const controller = new AbortController();
        const targets = extrudedIds.filter(id => !isVectorService(getServiceMode?.(id)));
        const wanted = new Set(targets.map(id => `${PREFIX}${id}`));

        managedIds(map, PREFIX).filter(id => !wanted.has(id)).forEach(id => removeGeojson(map, id));

        targets.forEach(async (layerId) => {
            const wmsConfig = findLayerDef(layerId, allLayers || [])?.wmsConfig;
            const params = paramsFor(olMap, layerId);
            if (!wmsConfig || !params) return;
            const cqlFilter = cqlSegmentFor(params, wmsConfig.layerName);
            const key = `${layerId}|${cqlFilter || ''}`;
            const sourceId = `${PREFIX}${layerId}`;
            try {
                let result = cacheRef.current.get(key);
                if (!result) {
                    reportExtrusion(layerId, 'loading');
                    result = await loadExtrusion({ wmsConfig, cqlFilter, signal: controller.signal, getLegendJson, layerId });
                    if (result.status === 'ready') cacheRef.current.set(key, result);
                }
                if (controller.signal.aborted) return;
                reportExtrusion(layerId, result.status);
                if (result.status !== 'ready') return;
                upsertGeojson(map, sourceId, result.collection);
                replaceLayers(map, sourceId, [extrusionLayer(`${sourceId}-ext`, sourceId, result.style, alturaColumnas)]);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.warn('[mapa3d] no se pudo extruir', layerId, error?.message || error);
                reportExtrusion(layerId, 'error');
            }
        });

        return () => controller.abort();
    }, [map, olMapRef, extrudedIds, allLayers, getServiceMode, getLegendJson, reportExtrusion, revision, alturaColumnas]);
};
