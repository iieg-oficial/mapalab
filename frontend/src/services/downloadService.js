import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { findLayerById } from '../pages/maps/helpers/layers/utils/layerHelpers';

let currentLayers = [];

export const setLayersForDownloadService = (newLayers) => {
    currentLayers = Array.isArray(newLayers) ? newLayers : [];
};

const getApiHost = () => import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');

const VECTOR_FORMATS = [
    { id: 'geopackage', label: 'GPKG', extension: 'gpkg', mimeType: 'application/geopackage+sqlite3', srs: 'EPSG:6368' },
    { id: 'shape-zip', label: 'SHP', extension: 'shp.zip', mimeType: 'application/zip', srs: 'EPSG:4326' },
    { id: 'csv', label: 'CSV', extension: 'csv', mimeType: 'text/csv', srs: 'EPSG:4326' }
];

const RASTER_FORMATS = [
    { id: 'geotiff', label: 'GeoTIFF', extension: 'tiff' }
];

export { VECTOR_FORMATS, RASTER_FORMATS };

const RASTER_WORKSPACES = new Set(['raster', 'lluvia', 'temperatura']);

const findFirstWMSConfig = (node) => {
    if (!node) return null;
    if (node.wmsConfig) return node.wmsConfig;
    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            const found = findFirstWMSConfig(child);
            if (found) return found;
        }
    }
    return null;
};

const resolveWMSConfig = (layerId) => {
    const direct = findWMSConfig(layerId, currentLayers);
    if (direct) return { wmsConfig: direct, isGroup: false };

    const node = findLayerById(layerId, currentLayers);
    if (!node) return null;

    const childConfig = findFirstWMSConfig(node);
    if (!childConfig) return null;

    return {
        wmsConfig: { ...childConfig, cqlFilter: '' },
        isGroup: true,
    };
};

export const isRasterLayer = (layerId) => {
    const resolved = resolveWMSConfig(layerId);
    return RASTER_WORKSPACES.has(resolved?.wmsConfig?.workspace);
};

export const getLayerConfig = (layerId) => {
    const resolved = resolveWMSConfig(layerId);
    if (!resolved) return null;
    const { wmsConfig } = resolved;
    const downloadLayerName = (wmsConfig.wfsLayerName || wmsConfig.layerName).split(':').pop();
    return {
        wmsConfig,
        workspace: wmsConfig.workspace,
        layerName: downloadLayerName,
        isRaster: RASTER_WORKSPACES.has(wmsConfig.workspace),
        hasFilter: !!wmsConfig.cqlFilter,
    };
};

const buildWFSUrl = (wmsConfig, format, cqlFilter) => {
    const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wfs');
    const params = {
        service: 'WFS',
        version: '1.1.0',
        request: 'GetFeature',
        typeName: wmsConfig.wfsLayerName || wmsConfig.layerName,
        outputFormat: format.id,
        srsName: format.srs || 'EPSG:4326'
    };
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    const filter = cqlFilter || wmsConfig.cqlFilter;
    if (filter) {
        url.searchParams.append('CQL_FILTER', filter);
    }
    return url.toString();
};

const buildWCSUrl = (wmsConfig, timeValue) => {
    const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wcs');
    const params = {
        service: 'WCS',
        version: '2.0.1',
        request: 'GetCoverage',
        coverageId: wmsConfig.layerName,
        format: 'image/geotiff'
    };
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    if (timeValue) {
        url.searchParams.append('SUBSET', `time("${timeValue}T00:00:00.000Z")`);
    }
    return url.toString();
};

const buildBackendCSVUrl = (workspace, layerName, dateFrom, dateTo) => {
    const base = `${getApiHost()}/download/${workspace}/${layerName}`;
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
};

const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const fetchBlob = async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('xml') || contentType.includes('html')) {
        throw new Error('GeoServer error response');
    }
    return response.blob();
};

const fetchWithProgress = async (url, signal, onProgress) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('xml') || contentType.includes('html')) {
        throw new Error('GeoServer error response');
    }

    if (!response.body || !onProgress) {
        return response.blob();
    }

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress({ loaded });
    }

    return new Blob(chunks);
};

const getMetadataFiles = (metadata) => {
    let metadatoList = [];
    if (Array.isArray(metadata?.metadato)) {
        metadatoList = metadata.metadato;
    } else if (metadata?.metadato && typeof metadata.metadato === 'object') {
        metadatoList = [metadata.metadato];
    }
    return metadatoList;
};

const addMetadataToZip = async (zip, metadatoList, selections) => {
    for (const meta of metadatoList) {
        if (!meta.enlace) continue;
        const filename = meta.enlace.split('/').pop() || 'metadata';
        const ext = filename.split('.').pop()?.toLowerCase();
        if (selections.txt && (ext === 'txt')) {
            try {
                const blob = await fetchBlob(meta.enlace);
                zip.file(filename, blob);
            } catch { /* optional */ }
        }
        if (selections.xlsx && (ext === 'xlsx' || ext === 'xls')) {
            try {
                const blob = await fetchBlob(meta.enlace);
                zip.file(filename, blob);
            } catch { /* optional */ }
        }
    }
};

const buildFilename = (layerId, extension) => {
    const layerNode = findLayerById(layerId, currentLayers);
    const label = (layerNode?.label || layerNode?.name || layerId).replace(/\s+/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    return `${label}_${date}.${extension}`;
};

const fetchLayerBlob = async (config, formatId, { signal, onProgress, dateFrom, dateTo, getFilter, layerId }) => {
    const { wmsConfig, workspace, layerName, isRaster, hasFilter } = config;

    if (isRaster) {
        const timeValue = getFilter?.(layerId) || undefined;
        const url = buildWCSUrl(wmsConfig, timeValue);
        return { blob: await fetchWithProgress(url, signal, onProgress), ext: 'tiff' };
    }

    if (formatId === 'csv') {
        let blob;
        if (hasFilter) {
            blob = await fetchWithProgress(buildWFSUrl(wmsConfig, VECTOR_FORMATS.find(f => f.id === 'csv')), signal, onProgress);
        } else {
            try {
                blob = await fetchWithProgress(buildBackendCSVUrl(workspace, layerName, dateFrom, dateTo), signal, onProgress);
            } catch {
                blob = await fetchWithProgress(buildWFSUrl(wmsConfig, VECTOR_FORMATS.find(f => f.id === 'csv')), signal, onProgress);
            }
        }
        return { blob, ext: 'csv' };
    }

    const fmt = VECTOR_FORMATS.find(f => f.id === formatId);
    if (!fmt) return null;
    return { blob: await fetchWithProgress(buildWFSUrl(wmsConfig, fmt), signal, onProgress), ext: fmt.extension };
};

const wrapDownload = async (fn) => {
    try {
        return await fn();
    } catch (error) {
        if (error.name === 'AbortError') return { success: false, cancelled: true };
        console.error('Error downloading:', error);
        return { success: false, error: error.message };
    }
};

export const downloadSingleFormat = (layerId, formatId, options = {}) =>
    wrapDownload(async () => {
        const config = getLayerConfig(layerId);
        if (!config) return { success: false, error: 'Capa no encontrada' };
        const result = await fetchLayerBlob(config, formatId, { ...options, layerId });
        if (!result) return { success: false, error: 'Formato no soportado' };
        triggerDownload(result.blob, buildFilename(layerId, result.ext));
        return { success: true };
    });

export const downloadWithMenu = (layerId, menuOptions = {}) =>
    wrapDownload(async () => {
        const { formatId = 'csv', dateMode = 'all', metadataSelections = { txt: false, xlsx: false }, metadata, signal, onProgress, getFilter } = menuOptions;
        const config = getLayerConfig(layerId);
        if (!config) return { success: false, error: 'Capa no encontrada' };

        let dateFrom, dateTo;
        if (dateMode === 'active' && getFilter) {
            const filterValue = getFilter(layerId);
            if (filterValue) { dateFrom = filterValue; dateTo = filterValue; }
        }

        const hasMetadata = metadataSelections.txt || metadataSelections.xlsx;
        const metadatoList = hasMetadata ? getMetadataFiles(metadata) : [];
        if (!hasMetadata || metadatoList.length === 0) {
            return downloadSingleFormat(layerId, formatId, { signal, onProgress, dateFrom, dateTo, getFilter });
        }

        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        signal?.throwIfAborted();

        const result = await fetchLayerBlob(config, formatId, { signal, onProgress, dateFrom, dateTo, getFilter, layerId });
        if (result) zip.file(`${config.layerName}.${result.ext}`, result.blob);

        signal?.throwIfAborted();
        await addMetadataToZip(zip, metadatoList, metadataSelections);

        signal?.throwIfAborted();
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, buildFilename(layerId, 'zip'));
        return { success: true };
    });

export const getAvailableMetadata = (metadata) => {
    const metadatoList = getMetadataFiles(metadata);
    let hasTxt = false;
    let hasXlsx = false;
    for (const meta of metadatoList) {
        if (!meta.enlace) continue;
        const ext = meta.enlace.split('.').pop()?.toLowerCase();
        if (ext === 'txt') hasTxt = true;
        if (ext === 'xlsx' || ext === 'xls') hasXlsx = true;
    }
    return { hasTxt, hasXlsx };
};
