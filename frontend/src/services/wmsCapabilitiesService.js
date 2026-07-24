import WMSCapabilities from 'ol/format/WMSCapabilities';
import { transformExtent } from 'ol/proj';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';

const parser = new WMSCapabilities();

const workspaceCache = new Map();
const inFlightByWorkspace = new Map();

const MERCATOR_MAX_LAT = 85.06;
const SANE_SPAN_DEG = 15;

export const sanitizeExtent4326 = (ext) => {
    if (!Array.isArray(ext) || ext.length !== 4 || ext.some(v => !Number.isFinite(v))) return null;
    let [minx, miny, maxx, maxy] = ext;
    const garbage =
        maxy > MERCATOR_MAX_LAT || miny < -MERCATOR_MAX_LAT ||
        (maxx - minx) > SANE_SPAN_DEG || (maxy - miny) > SANE_SPAN_DEG;
    if (!garbage) return ext;
    const [jx0, jy0, jx1, jy1] = JALISCO_BOUNDS.coords;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    minx = clamp(minx, jx0, jx1);
    maxx = clamp(maxx, jx0, jx1);
    miny = clamp(miny, jy0, jy1);
    maxy = clamp(maxy, jy0, jy1);
    if (maxx - minx < 0.05 || maxy - miny < 0.05) return [...JALISCO_BOUNDS.coords];
    return [Math.min(minx, maxx), Math.min(miny, maxy), Math.max(minx, maxx), Math.max(miny, maxy)];
};

export const parseTimeDimensionToPeriodicity = (values) => {
    if (!values || typeof values !== 'string') return null;
    const fecha = {};
    for (const raw of values.split(',')) {
        const iso = raw.trim().split('T')[0];
        const [y, m] = iso.split('-');
        const year = parseInt(y, 10);
        const month = parseInt(m, 10);
        if (!Number.isFinite(year) || !Number.isFinite(month)) continue;
        if (!fecha[year]) fecha[year] = {};
        fecha[year][month] = iso;
    }
    return Object.keys(fecha).length ? fecha : null;
};

const extractTimeValues = (node) => {
    const dims = node?.Dimension;
    if (!Array.isArray(dims)) {
        if (dims?.name?.toLowerCase() === 'time') return dims.values || dims.default || null;
        return null;
    }
    const timeDim = dims.find(d => d?.name?.toLowerCase() === 'time');
    return timeDim ? (timeDim.values || timeDim.default || null) : null;
};

const buildLayerExtentIndex = (capabilities) => {
    const index = new Map();
    const layers = capabilities?.Capability?.Layer?.Layer;
    if (!Array.isArray(layers)) return index;
    const store = (name, entry) => {
        index.set(name, entry);
        const localName = name.includes(':') ? name.split(':').pop() : name;
        if (localName !== name && !index.has(localName)) index.set(localName, entry);
    };
    const walk = (nodes) => {
        for (const node of nodes) {
            const name = node?.Name;
            const bbox = (node?.BoundingBox || []).find(b => b?.crs === 'EPSG:4326' || b?.crs === 'CRS:84')
                || node?.EX_GeographicBoundingBox && {
                    crs: 'EPSG:4326',
                    extent: node.EX_GeographicBoundingBox,
                };
            if (name) {
                let extent = null;
                if (bbox?.extent?.length === 4) {
                    const rawExt4326 = bbox.crs === 'CRS:84'
                        ? [bbox.extent[0], bbox.extent[1], bbox.extent[2], bbox.extent[3]]
                        : [bbox.extent[1], bbox.extent[0], bbox.extent[3], bbox.extent[2]];
                    extent = sanitizeExtent4326(rawExt4326);
                }
                const time = parseTimeDimensionToPeriodicity(extractTimeValues(node));
                if (extent || time) store(name, { extent, time });
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

const findEntry = (index, wmsConfig) => {
    const candidates = [
        wmsConfig.layerName,
        wmsConfig.geoserverLayer,
        wmsConfig.wmsGroup,
    ].filter(Boolean);
    for (const name of candidates) {
        const entry = index.get(name);
        if (entry) return entry;
        const local = name.includes(':') ? name.split(':').pop() : name;
        const alt = index.get(local);
        if (alt) return alt;
    }
    return null;
};

export const getLayerExtent4326 = async (wmsConfig) => {
    if (!wmsConfig?.baseUrl) return null;
    const index = await fetchWorkspaceCapabilities(wmsConfig.baseUrl);
    if (!index) return null;
    return findEntry(index, wmsConfig)?.extent || null;
};

export const getLayerExtent3857 = async (wmsConfig) => {
    const ext4326 = await getLayerExtent4326(wmsConfig);
    if (!ext4326) return null;
    return transformExtent(ext4326, 'EPSG:4326', 'EPSG:3857');
};

export const getLayerTimePeriodicity = async (wmsConfig) => {
    if (!wmsConfig?.baseUrl) return null;
    const index = await fetchWorkspaceCapabilities(wmsConfig.baseUrl);
    if (!index) return null;
    return findEntry(index, wmsConfig)?.time || null;
};

export const clearCapabilitiesCache = () => {
    workspaceCache.clear();
    inFlightByWorkspace.clear();
};
