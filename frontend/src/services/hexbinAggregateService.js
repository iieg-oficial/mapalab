import GeoJSON from 'ol/format/GeoJSON';
import { VECTOR_PROJECTION } from '@services/vectorLayerService';

const HEXBIN_LAYER = 'mapalab:hexbin_agregado';

export const PRECOMPUTED_RESOLUTIONS = new Set([3, 4, 5, 6, 7, 8]);

export const nearestPrecomputed = (resolution) => {
    if (!Number.isFinite(resolution)) return null;
    if (PRECOMPUTED_RESOLUTIONS.has(resolution)) return resolution;
    const menores = [...PRECOMPUTED_RESOLUTIONS].filter(r => r < resolution);
    return menores.length ? Math.max(...menores) : null;
};

const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');

const REQUEST_TIMEOUT_MS = 20000;

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

export const buildAggregateCql = (layerIds, resolution) => {
    const keys = layerIds.map(quote).join(',');
    return `layer_key IN (${keys}) AND resolution = ${resolution}`
        + ' AND anio IS NULL AND clave_municipio IS NULL';
};

export const fetchAggregatedCells = async (layerIds, resolution, signal) => {
    if (!GEOSERVER_BASE || !layerIds?.length || !PRECOMPUTED_RESOLUTIONS.has(resolution)) return null;

    const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: HEXBIN_LAYER,
        outputFormat: 'application/json',
        srsName: VECTOR_PROJECTION,
        propertyName: 'h3_index,total,geom',
        CQL_FILTER: buildAggregateCql(layerIds, resolution)
    });

    const workspace = HEXBIN_LAYER.split(':')[0];
    const url = `${GEOSERVER_BASE}/${workspace}/wfs?${params.toString()}`;

    const response = await fetch(url, { signal: signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.features?.length) return null;

    return new GeoJSON().readFeatures(data, {
        dataProjection: VECTOR_PROJECTION,
        featureProjection: VECTOR_PROJECTION
    });
};
