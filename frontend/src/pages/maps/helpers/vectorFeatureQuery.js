import GeoJSON from 'ol/format/GeoJSON';
import { SERVICE_VECTOR, VECTOR_LAYER_FLAG } from './serviceMode';
import { VECTOR_PROJECTION } from '@services/vectorLayerService';

const HIT_TOLERANCE = 5;

export const queryVectorFeaturesAtPixel = (map, coordinate, targetLayerIds) => {
    if (!map || !coordinate || !targetLayerIds || targetLayerIds.size === 0) return [];

    const pixel = map.getPixelFromCoordinate(coordinate);
    if (!pixel) return [];

    const format = new GeoJSON();
    const byLayer = new Map();

    map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        if (!layer?.get?.(VECTOR_LAYER_FLAG)) return;

        const layerId = layer.get('layerId');
        if (!targetLayerIds.has(layerId)) return;

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
    const vectorLayerIds = new Set(
        layersToQuery.filter(l => getServiceMode?.(l.id) === SERVICE_VECTOR).map(l => l.id)
    );

    const localResults = queryVectorFeaturesAtPixel(map, coordinate, vectorLayerIds).map(result => ({
        ...result,
        layerName: layersToQuery.find(l => l.id === result.layerId)?.name || null,
        raw: null
    }));

    return {
        remoteLayers: layersToQuery.filter(l => !vectorLayerIds.has(l.id)),
        localResults
    };
};
