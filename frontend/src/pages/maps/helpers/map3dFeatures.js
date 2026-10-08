import { countVectorFeatures, fetchVectorFeatures } from '@services/vectorLayerService';
import { VECTOR_FEATURE_LIMIT } from './serviceMode';
import { toLonLatCollection } from './olToGeojson';

export const paramsFor = (olMap, layerId) => {
    const layer = olMap.getLayers().getArray().find(candidate => (candidate.get('mergedLayers') || [])
        .some(entry => entry.subLayers?.some(sub => sub.id === layerId)));
    return layer ? layer.getSource().getParams() : null;
};

export const fetchLayerData = async ({ wmsConfig, cqlFilter, signal, getLegendJson, layerId }) => {
    const total = await countVectorFeatures(wmsConfig, cqlFilter, signal);
    if (total !== null && total > VECTOR_FEATURE_LIMIT) return { status: 'too_large' };
    const [json, legendJson] = await Promise.all([
        fetchVectorFeatures(wmsConfig, cqlFilter, signal),
        getLegendJson({ id: layerId }),
    ]);
    return { status: 'ok', collection: toLonLatCollection(json), legendJson };
};
