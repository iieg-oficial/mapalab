import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { layers, findLayerById, collectLayersWithWMS } from '../pages/maps/helpers/layers/index';
import { getLayerMetadata } from './layerMetadataService';

const VECTOR_FORMATS = [
    { id: 'shape-zip', extension: 'shp.zip', mimeType: 'application/zip', srs: 'EPSG:4326' },
    { id: 'geopackage', extension: 'gpkg', mimeType: 'application/geopackage+sqlite3', srs: 'EPSG:6368' },
    { id: 'csv', extension: 'csv', mimeType: 'text/csv', srs: 'EPSG:4326' }
];

const buildWFSUrl = (wmsConfig, format) => {
    const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wfs');
    const params = {
        service: 'WFS',
        version: '1.1.0',
        request: 'GetFeature',
        typeName: wmsConfig.layerName,
        outputFormat: format.id,
        srsName: format.srs || 'EPSG:4326'
    };
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
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

const fetchBlob = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('xml') || contentType.includes('html')) {
        throw new Error('GeoServer error response');
    }
    return response.blob();
};

const addMetadataToZip = async (zip, metadata) => {
    const files = [metadata?.metadato_txt, metadata?.metadato_xlsx].filter(Boolean);
    if (files.length === 0) return;
    for (const url of files) {
        try {
            const blob = await fetchBlob(url);
            const filename = url.split('/').pop() || 'metadata';
            zip.file(filename, blob);
        } catch { /* metadata fetch is optional */ }
    }
};

const RASTER_WORKSPACES = new Set(['raster', 'lluvia', 'temperatura']);

export const isRasterLayer = (layerId) => {
    const wmsConfig = findWMSConfig(layerId, layers);
    return RASTER_WORKSPACES.has(wmsConfig?.workspace);
};

const getActiveSubLayers = (layerId, activeLayerIds) => {
    const layer = findLayerById(layerId, layers);
    if (!layer) return [];
    const allSubLayers = collectLayersWithWMS(layer);
    const activeIdSet = new Set(activeLayerIds);
    return allSubLayers.filter(sub =>
        activeIdSet.has(sub.id) && findWMSConfig(sub.id, layers)
    );
};

const downloadSingleVector = async (wmsConfig, layerName, zip, folder) => {
    const target = folder || zip;
    const results = await Promise.allSettled(
        VECTOR_FORMATS.map(async (fmt) => {
            const url = buildWFSUrl(wmsConfig, fmt);
            const blob = await fetchBlob(url);
            target.file(`${layerName}.${fmt.extension}`, blob);
        })
    );
    return results;
};

const downloadSingleRaster = async (wmsConfig, layerName, zip, timeValue) => {
    const url = buildWCSUrl(wmsConfig, timeValue);
    const result = await Promise.allSettled([
        fetchBlob(url).then(blob => zip.file(`${layerName}.tiff`, blob))
    ]);
    return result;
};

export const downloadLayerBundle = async (layerId, options = {}) => {
    const { activeLayerIds = [], getFilter } = options;

    try {
        const wmsConfig = findWMSConfig(layerId, layers);
        const isGrouped = !wmsConfig;

        let subLayers = [];
        if (isGrouped) {
            subLayers = getActiveSubLayers(layerId, activeLayerIds);
            if (subLayers.length === 0) {
                return { success: false, error: 'No se encontraron subcapas activas' };
            }
        }

        const targetConfig = isGrouped ? findWMSConfig(subLayers[0].id, layers) : wmsConfig;
        const raster = RASTER_WORKSPACES.has(targetConfig?.workspace);
        const layerName = isGrouped
            ? layerId
            : (wmsConfig.layerName.split(':').pop());

        const getTimeValue = (id, config) => {
            if (!config?.timeEnabled || !getFilter) return undefined;
            return getFilter(id) || undefined;
        };

        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();

        const metaResult = await Promise.allSettled([getLayerMetadata(layerId)]);
        const metadata = metaResult[0].status === 'fulfilled' ? metaResult[0].value : null;

        if (isGrouped) {
            for (const sub of subLayers) {
                const subConfig = findWMSConfig(sub.id, layers);
                if (!raster && subConfig.wfsAvailable === false) continue;
                const subName = subConfig.layerName.split(':').pop();
                const folder = zip.folder(subName);
                if (raster) {
                    await downloadSingleRaster(subConfig, subName, folder, getTimeValue(sub.id, subConfig));
                } else {
                    await downloadSingleVector(subConfig, subName, zip, folder);
                }
            }
        } else if (raster) {
            await downloadSingleRaster(wmsConfig, layerName, zip, getTimeValue(layerId, wmsConfig));
        } else if (wmsConfig.wfsAvailable !== false) {
            await downloadSingleVector(wmsConfig, layerName, zip);
        }

        await addMetadataToZip(zip, metadata);

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const layerNode = findLayerById(layerId, layers);
        const userLabel = (layerNode?.label || layerNode?.name || layerName).replace(/\s+/g, '_');
        const date = new Date().toISOString().slice(0, 10);
        triggerDownload(zipBlob, `${userLabel}_${date}.zip`);

        return { success: true };
    } catch (error) {
        console.error('Error downloading layer bundle:', error);
        return { success: false, error: error.message };
    }
};
