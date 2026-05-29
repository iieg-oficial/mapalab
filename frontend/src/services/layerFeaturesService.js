export const FEATURE_CAP = 500;
const REQUEST_TIMEOUT_MS = 4000;

const RASTER_WORKSPACES = new Set(['raster', 'lluvia', 'temperatura']);

export const isRasterWorkspace = (workspace) => RASTER_WORKSPACES.has(workspace);

const buildTimeoutSignal = () => {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    }
    return undefined;
};

export const fetchLayerFeaturesInBbox = async (wmsConfig, bbox3857, { signal, cap = FEATURE_CAP } = {}) => {
    if (!wmsConfig?.baseUrl || !Array.isArray(bbox3857) || bbox3857.length !== 4) return null;
    if (wmsConfig.wfsAvailable === false) return null;
    if (isRasterWorkspace(wmsConfig.workspace)) return null;

    const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wfs');
    const typeName = wmsConfig.wfsLayerName || wmsConfig.layerName;
    if (!typeName) return null;

    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '1.1.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typeName', typeName);
    url.searchParams.set('outputFormat', 'application/json');
    url.searchParams.set('srsName', 'EPSG:3857');
    url.searchParams.set('bbox', `${bbox3857.join(',')},EPSG:3857`);
    url.searchParams.set('count', String(cap + 1));
    if (wmsConfig.cqlFilter) {
        url.searchParams.set('CQL_FILTER', wmsConfig.cqlFilter);
    }

    try {
        const res = await fetch(url.toString(), {
            credentials: 'include',
            signal: signal || buildTimeoutSignal(),
        });
        if (!res.ok) return null;
        const json = await res.json();
        const features = Array.isArray(json?.features) ? json.features : [];
        if (features.length > cap) return null;
        return json;
    } catch (err) {
        console.debug('[layerFeatures] fallo:', err?.message || err);
        return null;
    }
};
