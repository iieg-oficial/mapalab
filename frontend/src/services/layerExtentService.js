import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { getWfsUrl, parseResponse } from '@utils/featureInfoUtils';

const extentCache = new Map();
const MAX_CACHE_SIZE = 50;

const setCached = (key, value) => {
    if (extentCache.has(key)) extentCache.delete(key);
    extentCache.set(key, value);
    if (extentCache.size > MAX_CACHE_SIZE) {
        const oldest = extentCache.keys().next().value;
        extentCache.delete(oldest);
    }
};

export const fetchLayerExtent = async (layer, { timeoutMs = 10000 } = {}) => {
    const wmsConfig = layer?.wmsConfig;
    if (!wmsConfig?.baseUrl || !wmsConfig?.layerName) return null;

    const cacheKey = `${wmsConfig.baseUrl}|${wmsConfig.layerName}|${wmsConfig.cqlFilter || ''}`;
    if (extentCache.has(cacheKey)) return extentCache.get(cacheKey);

    const wfsUrl = getWfsUrl(wmsConfig.baseUrl);
    const params = {
        SERVICE: 'WFS',
        VERSION: '2.0.0',
        REQUEST: 'GetFeature',
        TYPENAMES: wmsConfig.layerName,
        OUTPUTFORMAT: 'application/json',
        SRSNAME: 'EPSG:3857'
    };
    if (wmsConfig.cqlFilter) params.CQL_FILTER = wmsConfig.cqlFilter;

    const url = wfsUrl + '?' + new URLSearchParams(params).toString();

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        const data = await parseResponse(response);
        if (!data?.features?.length) {
            setCached(cacheKey, null);
            return null;
        }

        const source = new VectorSource({
            features: new GeoJSON().readFeatures(data, {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:3857'
            })
        });
        const extent = source.getExtent();
        if (!extent || extent.some(v => !Number.isFinite(v))) {
            setCached(cacheKey, null);
            return null;
        }

        setCached(cacheKey, extent);
        return extent;
    } catch {
        return null;
    }
};

export const clearExtentCache = () => {
    extentCache.clear();
};
