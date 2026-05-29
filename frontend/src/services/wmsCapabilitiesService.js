import WMSCapabilities from 'ol/format/WMSCapabilities';
import { transformExtent } from 'ol/proj';

const parser = new WMSCapabilities();

const workspaceCache = new Map();
const inFlightByWorkspace = new Map();

const buildLayerExtentIndex = (capabilities) => {
    const index = new Map();
    const layers = capabilities?.Capability?.Layer?.Layer;
    if (!Array.isArray(layers)) return index;
    const walk = (nodes) => {
        for (const node of nodes) {
            const name = node?.Name;
            const bbox = (node?.BoundingBox || []).find(b => b?.crs === 'EPSG:4326' || b?.crs === 'CRS:84')
                || node?.EX_GeographicBoundingBox && {
                    crs: 'EPSG:4326',
                    extent: node.EX_GeographicBoundingBox,
                };
            if (name && bbox?.extent?.length === 4) {
                const ext4326 = bbox.crs === 'CRS:84'
                    ? [bbox.extent[0], bbox.extent[1], bbox.extent[2], bbox.extent[3]]
                    : [bbox.extent[1], bbox.extent[0], bbox.extent[3], bbox.extent[2]];
                index.set(name, ext4326);
                const localName = name.includes(':') ? name.split(':').pop() : name;
                if (localName !== name && !index.has(localName)) {
                    index.set(localName, ext4326);
                }
            }
            if (Array.isArray(node?.Layer)) walk(node.Layer);
        }
    };
    walk(layers);
    return index;
};

export const fetchWorkspaceCapabilities = async (baseUrl) => {
    if (!baseUrl) return null;
    if (workspaceCache.has(baseUrl)) return workspaceCache.get(baseUrl);
    if (inFlightByWorkspace.has(baseUrl)) return inFlightByWorkspace.get(baseUrl);

    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('service', 'WMS');
    url.searchParams.set('version', '1.3.0');
    url.searchParams.set('request', 'GetCapabilities');

    const promise = (async () => {
        try {
            const res = await fetch(url.toString(), { credentials: 'include' });
            if (!res.ok) throw new Error(`GetCapabilities ${res.status}`);
            const text = await res.text();
            const parsed = parser.read(text);
            const index = buildLayerExtentIndex(parsed);
            workspaceCache.set(baseUrl, index);
            return index;
        } catch (err) {
            console.debug('[wmsCapabilities] fallo:', err?.message || err);
            workspaceCache.set(baseUrl, new Map());
            return workspaceCache.get(baseUrl);
        } finally {
            inFlightByWorkspace.delete(baseUrl);
        }
    })();

    inFlightByWorkspace.set(baseUrl, promise);
    return promise;
};

export const getLayerExtent4326 = async (wmsConfig) => {
    if (!wmsConfig?.baseUrl) return null;
    const index = await fetchWorkspaceCapabilities(wmsConfig.baseUrl);
    if (!index) return null;
    const candidates = [
        wmsConfig.layerName,
        wmsConfig.geoserverLayer,
        wmsConfig.wmsGroup,
    ].filter(Boolean);
    for (const name of candidates) {
        const ext = index.get(name);
        if (ext) return ext;
        const local = name.includes(':') ? name.split(':').pop() : name;
        const altExt = index.get(local);
        if (altExt) return altExt;
    }
    return null;
};

export const getLayerExtent3857 = async (wmsConfig) => {
    const ext4326 = await getLayerExtent4326(wmsConfig);
    if (!ext4326) return null;
    return transformExtent(ext4326, 'EPSG:4326', 'EPSG:3857');
};

export const clearCapabilitiesCache = () => {
    workspaceCache.clear();
    inFlightByWorkspace.clear();
};
