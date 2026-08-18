import GeoJSON from 'ol/format/GeoJSON';
import { LOCAL_SERVICES, VECTOR_LAYER_FLAG } from './serviceMode';
import { HEXBIN_LAYER_FLAG } from './hexbinLayer';
import { VECTOR_PROJECTION } from '@services/vectorLayerService';

const HIT_TOLERANCE = 5;

const matchedMemberId = (layer, targetLayerIds) => {
    const layerId = layer.get('layerId');
    if (targetLayerIds.has(layerId)) return layerId;
    const memberIds = layer.get('memberIds');
    if (!Array.isArray(memberIds)) return null;
    return memberIds.find(id => targetLayerIds.has(id)) || null;
};

export const findHexbinCellAtPixel = (map, coordinate, targetLayerIds) => {
    if (!map || !coordinate || !targetLayerIds || targetLayerIds.size === 0) return null;

    const pixel = map.getPixelFromCoordinate(coordinate);
    if (!pixel) return null;

    let hit = null;
    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        if (hit || !layer?.get?.(HEXBIN_LAYER_FLAG)) return;

        const layerId = matchedMemberId(layer, targetLayerIds);
        if (!layerId) return;

        const geometry = feature.getGeometry?.();
        if (!geometry) return;

        hit = {
            layerId,
            layer,
            h3Index: feature.get('h3Index'),
            count: feature.get('count'),
            geometry
        };
    });

    return hit;
};

export const markSelectedCell = (layer, h3Index) => {
    if (!layer) return;
    layer.set('selectedCell', h3Index || null);
    layer.changed();
};

const queryVectorFeaturesAtPixel = (map, coordinate, targetLayerIds) => {
    if (!map || !coordinate || !targetLayerIds || targetLayerIds.size === 0) return [];

    const pixel = map.getPixelFromCoordinate(coordinate);
    if (!pixel) return [];

    const format = new GeoJSON();
    const byLayer = new Map();

    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        if (!layer?.get?.(VECTOR_LAYER_FLAG)) return;

        const layerId = matchedMemberId(layer, targetLayerIds);
        if (!layerId) return;

        if (!byLayer.has(layerId)) byLayer.set(layerId, []);
        byLayer.get(layerId).push(format.writeFeatureObject(feature, {
            dataProjection: VECTOR_PROJECTION,
            featureProjection: VECTOR_PROJECTION
        }));
    }, { hitTolerance: HIT_TOLERANCE });

    return Array.from(byLayer.entries()).map(([layerId, features]) => ({
        layerId,
        features,
        totalFeatures: features.length
    }));
};

export const resolveLocalFeatureResults = (map, coordinate, layersToQuery, getServiceMode) => {
    const localLayerIds = new Set(
        layersToQuery.filter(l => LOCAL_SERVICES.has(getServiceMode?.(l.id))).map(l => l.id)
    );

    const nameOf = (layerId) => layersToQuery.find(l => l.id === layerId)?.name || null;

    const localResults = queryVectorFeaturesAtPixel(map, coordinate, localLayerIds).map(result => ({
        ...result,
        layerName: nameOf(result.layerId),
        raw: null
    }));

    return {
        remoteLayers: layersToQuery.filter(l => !localLayerIds.has(l.id)),
        localResults
    };
};
