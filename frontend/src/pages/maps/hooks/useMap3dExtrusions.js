import { useEffect, useRef } from 'react';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { isVectorService } from '@pages/maps/helpers/serviceMode';
import { cqlSegmentFor } from '@pages/maps/helpers/view3d';
import { colorExpression, numericProperties, parseLegendRules, quantileClasses } from '@pages/maps/helpers/extrusionRules';
import { fetchLayerData, paramsFor } from '@pages/maps/helpers/map3dFeatures';
import {
    extrusionLayer, managedIds, maxOf, removeGeojson, replaceLayers, upsertGeojson,
} from '@pages/maps/helpers/map3dLayerSpecs';
import { useOlWmsRevision } from './useOlWmsRevision';

const PREFIX = 'ext-';

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

export const loadExtrusion = async (options) => {
    const data = await fetchLayerData(options);
    if (data.status !== 'ok') return data;
    const style = resolveStyle(data.collection, data.legendJson);
    if (!style) return { status: 'no_value' };
    return { status: 'ready', collection: data.collection, style: { ...style, maxValue: maxOf(data.collection.features, style.property) } };
};

export const useMap3dExtrusions = (map, olMapRef, { extrudedIds, allLayers, getServiceMode, getLegendJson, reportExtrusion, alturaColumnas = 1 }) => {
    const cacheRef = useRef(new Map());
    const revision = useOlWmsRevision(map, olMapRef);

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
