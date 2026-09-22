import { useEffect } from 'react';
import { unByKey } from 'ol/Observable';
import { getUid } from 'ol/util';
import { HEXBIN_LAYER_FLAG } from '@pages/maps/helpers/hexbinLayer';
import { VECTOR_LAYER_FLAG } from '@pages/maps/helpers/serviceMode';
import { RELIEF_LAYER_ID } from '@pages/maps/helpers/view3d';
import { numericProperties } from '@pages/maps/helpers/extrusionRules';
import { bakedCollection, geometryKind } from '@pages/maps/helpers/olToGeojson';
import {
    managedIds, maxOf, removeGeojson, replaceLayers, upsertGeojson, vectorLayerSpecs,
} from '@pages/maps/helpers/map3dLayerSpecs';

const PREFIX = 'vec-';

const isLocalVector = (layer) => !!(layer.get(HEXBIN_LAYER_FLAG) || layer.get(VECTOR_LAYER_FLAG));

const layerIdsOf = (layer) => [layer.get('layerId'), ...(layer.get('memberIds') || [])].filter(Boolean);

const extrusionFor = (layer, collection, extrudedIds) => {
    if (!layerIdsOf(layer).some(id => extrudedIds.includes(id))) return null;
    const property = layer.get(HEXBIN_LAYER_FLAG) ? 'count' : numericProperties(collection.features)[0];
    if (!property) return null;
    return { property, maxValue: maxOf(collection.features, property), color: ['get', '_fill'] };
};

const syncVectors = (map, olMap, extrudedIds) => {
    const resolution = olMap.getView().getResolution();
    const layers = olMap.getLayers().getArray().filter(layer => isLocalVector(layer) && layer.getVisible());
    const wanted = new Set();

    layers.forEach((layer) => {
        const id = `${PREFIX}${getUid(layer)}`;
        wanted.add(id);
        const collection = bakedCollection(layer, resolution);
        const kind = geometryKind(collection);
        upsertGeojson(map, id, collection);
        const extrusion = kind === 'polygon' ? extrusionFor(layer, collection, extrudedIds) : null;
        replaceLayers(map, id, vectorLayerSpecs(id, kind, { opacity: layer.getOpacity(), extrusion }), RELIEF_LAYER_ID);
    });

    managedIds(map, PREFIX).filter(id => !wanted.has(id)).forEach(id => removeGeojson(map, id));
};

export const useMap3dVectors = (map, olMapRef, extrudedIds) => {
    useEffect(() => {
        const olMap = olMapRef.current;
        if (!map || !olMap) return undefined;

        let frame = null;
        let layerKeys = [];
        const run = () => {
            unByKey(layerKeys);
            layerKeys = olMap.getLayers().getArray().filter(isLocalVector).flatMap(layer => [
                layer.on(['change:opacity', 'change:visible'], schedule),
                layer.getSource().on('change', schedule),
            ]);
            syncVectors(map, olMap, extrudedIds);
        };
        function schedule() {
            if (frame !== null) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                run();
            });
        }

        const collectionKeys = olMap.getLayers().on(['add', 'remove'], schedule);
        run();

        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            unByKey(collectionKeys);
            unByKey(layerKeys);
        };
    }, [map, olMapRef, extrudedIds]);
};
