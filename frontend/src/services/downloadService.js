import { findWMSConfig, hydrateWmsConfig } from '../pages/maps/helpers/wmsConfig';
import { findLayerById } from '../pages/maps/helpers/layers/utils/layerHelpers';
import { cqlToDateRange } from '../pages/maps/helpers/dateFilterHelpers';
import { getMetadataFiles, addMetadataToZip, getAvailableMetadata } from './downloadMetadata';
import { buildFilename } from './downloadFilename';
import {
    RASTER_FORMATS,
    RASTER_WORKSPACES,
    VECTOR_FORMATS,
    buildBackendCSVUrl,
    buildWCSUrl,
    buildWFSUrl,
    fetchNonGeometryColumns,
    findVectorFormat,
    supportsFileSystemAccess,
} from './downloadUrls';

let currentLayers = [];

export const setLayersForDownloadService = (newLayers) => {
    currentLayers = Array.isArray(newLayers) ? newLayers : [];
};

export { VECTOR_FORMATS, RASTER_FORMATS };
export { getAvailableMetadata };

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

const resolveTotalBytes = (response) => {
    if (response.headers.get('content-encoding')) return null;
    const length = Number(response.headers.get('content-length'));
    return Number.isFinite(length) && length > 0 ? length : null;
};

const openValidatedResponse = async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('xml') || contentType.includes('html')) {
        throw new Error('GeoServer error response');
    }
    return response;
};

const consumeResponse = async (response, { onProgress, writable } = {}) => {
    if (!response.body || (!onProgress && !writable)) {
        const blob = await response.blob();
        if (writable) { await writable.write(blob); await writable.close(); return null; }
        return blob;
    }

    const total = resolveTotalBytes(response);
    const reader = response.body.getReader();
    const chunks = writable ? null : [];
    let loaded = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (writable) await writable.write(value);
        else chunks.push(value);
        loaded += value.length;
        onProgress?.({ loaded, total });
    }

    if (writable) { await writable.close(); return null; }
    return new Blob(chunks);
};

const layerFilename = (layerId, extension, filter, labelOverride = null) => {
    const node = findLayerById(layerId, currentLayers);
    const label = labelOverride || node?.label || node?.name || layerId;
    return buildFilename(label, extension, { filter, rasterPeriodicity: node?.rasterPeriodicity || null });
};

const downloadedFilter = (config, layerId, { getFilter, dateCql } = {}) =>
    (config.isRaster ? getFilter?.(layerId) : dateCql) || null;

const extForFormat = (config, formatId) => {
    if (config.isRaster) return 'tiff';
    if (formatId === 'csv') return 'csv';
    return findVectorFormat(formatId)?.extension || null;
};

const resolveLayerResponse = async (config, formatId, { signal, dateFrom, dateTo, dateCql, getFilter, layerId }) => {
    const { wmsConfig, workspace, layerName, isRaster, hasFilter } = config;

    if (isRaster) {
        const timeValue = getFilter?.(layerId) || undefined;
        return openValidatedResponse(buildWCSUrl(wmsConfig, timeValue), signal);
    }

    if (formatId === 'csv') {
        const csvFmt = findVectorFormat('csv');
        const wfsCsv = async () => {
            const columns = await fetchNonGeometryColumns(wmsConfig, signal);
            return openValidatedResponse(buildWFSUrl(wmsConfig, csvFmt, dateCql, columns), signal);
        };
        const wfsOnly = hasFilter || (dateCql && !dateFrom);
        if (wfsOnly) return wfsCsv();
        try {
            return await openValidatedResponse(buildBackendCSVUrl(workspace, layerName, dateFrom, dateTo), signal);
        } catch {
            return wfsCsv();
        }
    }

    const fmt = findVectorFormat(formatId);
    if (!fmt) return null;
    return openValidatedResponse(buildWFSUrl(wmsConfig, fmt, dateCql), signal);
};

const fetchLayerBlob = async (config, formatId, options) => {
    const ext = extForFormat(config, formatId);
    if (!ext) return null;
    const response = await resolveLayerResponse(config, formatId, options);
    if (!response) return null;
    const blob = await consumeResponse(response, { onProgress: options.onProgress });
    return { blob, ext };
};

const runLayerDownload = async (config, formatId, filename, options) => {
    if (supportsFileSystemAccess()) {
        let handle;
        try {
            handle = await window.showSaveFilePicker({ suggestedName: filename });
        } catch (error) {
            if (error?.name === 'AbortError') return { success: false, cancelled: true };
            handle = null;
        }
        if (handle) {
            const response = await resolveLayerResponse(config, formatId, options);
            if (!response) return { success: false, error: 'Formato no soportado' };
            const writable = await handle.createWritable();
            try {
                await consumeResponse(response, { onProgress: options.onProgress, writable });
            } catch (error) {
                try { await writable.abort(); } catch { /* ya cerrado */ }
                throw error;
            }
            return { success: true };
        }
    }

    const response = await resolveLayerResponse(config, formatId, options);
    if (!response) return { success: false, error: 'Formato no soportado' };
    const blob = await consumeResponse(response, { onProgress: options.onProgress });
    triggerDownload(blob, filename);
    return { success: true };
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
        const ext = extForFormat(config, formatId);
        if (!ext) return { success: false, error: 'Formato no soportado' };
        const filter = downloadedFilter(config, layerId, options);
        return runLayerDownload(config, formatId, layerFilename(layerId, ext, filter), { ...options, layerId });
    });

export const downloadWithMenu = (layerId, menuOptions = {}) =>
    wrapDownload(async () => {
        const { formatId = 'csv', dateMode = 'all', metadataSelections = { txt: false, xlsx: false }, metadata, signal, onProgress, getFilter, getSpecificFilter } = menuOptions;
        const config = getLayerConfig(layerId);
        if (!config) return { success: false, error: 'Capa no encontrada' };

        let dateFrom, dateTo, dateCql;
        if (dateMode === 'active' && !config.isRaster) {
            dateCql = getSpecificFilter?.(layerId, 'date') || getFilter?.(layerId) || undefined;
            const range = cqlToDateRange(dateCql);
            if (range) {
                dateFrom = range.dateFrom;
                dateTo = range.dateTo;
            }
        }

        const hasMetadata = metadataSelections.txt || metadataSelections.xlsx;
        const metadatoList = hasMetadata ? getMetadataFiles(metadata) : [];
        if (!hasMetadata || metadatoList.length === 0) {
            return downloadSingleFormat(layerId, formatId, { signal, onProgress, dateFrom, dateTo, dateCql, getFilter });
        }

        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        signal?.throwIfAborted();

        const filter = downloadedFilter(config, layerId, { getFilter, dateCql });
        const result = await fetchLayerBlob(config, formatId, { signal, onProgress, dateFrom, dateTo, dateCql, getFilter, layerId });
        if (result) zip.file(layerFilename(layerId, result.ext, filter, config.layerName), result.blob);

        signal?.throwIfAborted();
        await addMetadataToZip(zip, metadatoList, metadataSelections);

        signal?.throwIfAborted();
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, layerFilename(layerId, 'zip', filter));
        return { success: true };
    });

export const downloadCatalogoCapa = (capa, formatId, options = {}) =>
    wrapDownload(async () => {
        const { signal, onProgress, cqlFilter = null, timeValue = null, rasterPeriodicity = null } = options;
        const wmsConfig = hydrateWmsConfig({
            geoserverWorkspace: capa.geoserverWorkspace,
            geoserverLayer: capa.geoserverLayer,
        });
        if (!wmsConfig) return { success: false, error: 'Capa no válida' };

        const dateRange = cqlFilter ? cqlToDateRange(cqlFilter) : null;
        const config = {
            wmsConfig,
            workspace: capa.workspaceAlias,
            layerName: capa.geoserverLayer,
            isRaster: RASTER_WORKSPACES.has(wmsConfig.workspace),
            hasFilter: !!wmsConfig.cqlFilter,
        };

        const ext = extForFormat(config, formatId);
        if (!ext) return { success: false, error: 'Formato no soportado' };

        const filter = config.isRaster ? timeValue : cqlFilter;
        const filename = buildFilename(capa.nombre || capa.slug, ext, { filter, rasterPeriodicity });
        return runLayerDownload(config, formatId, filename, {
            signal,
            onProgress,
            dateFrom: dateRange?.dateFrom,
            dateTo: dateRange?.dateTo,
            dateCql: cqlFilter || undefined,
            getFilter: timeValue ? () => timeValue : undefined,
            layerId: capa.slug,
        });
    });
