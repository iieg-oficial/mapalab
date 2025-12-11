import JSZip from 'jszip';
import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { layers, findLayerById, collectLayersWithWMS } from '../pages/maps/helpers/layers/index';

export const DOWNLOAD_FORMATS = {
    SHAPEFILE: {
        id: 'shape-zip',
        label: 'Shapefile (ZIP)',
        extension: 'zip',
        mimeType: 'application/zip',
        enabled: true
    },
    GEOPACKAGE: {
        id: 'application/geopackage+sqlite3',
        label: 'GeoPackage',
        extension: 'gpkg',
        mimeType: 'application/geopackage+sqlite3',
        enabled: false
    },
    GEOJSON: {
        id: 'json',
        label: 'GeoJSON',
        extension: 'geojson',
        mimeType: 'application/json',
        enabled: true
    },
    CSV: {
        id: 'csv',
        label: 'CSV',
        extension: 'csv',
        mimeType: 'text/csv',
        enabled: true
    },
    KML: {
        id: 'application/vnd.google-earth.kml+xml',
        label: 'KML',
        extension: 'kml',
        mimeType: 'application/vnd.google-earth.kml+xml',
        enabled: true
    }
};

const combineCQLFilters = (...filters) => {
    const validFilters = filters.filter(f => f && typeof f === 'string' && f.trim());
    if (validFilters.length === 0) return null;
    if (validFilters.length === 1) return validFilters[0];
    return validFilters.map(f => `(${f})`).join(' AND ');
};

export const buildDownloadURL = (layerId, format, options = {}) => {
    const { applyFilters = true, getFilter = null } = options;

    const wmsConfig = findWMSConfig(layerId, layers);
    if (!wmsConfig) {
        throw new Error(`No WMS config found for layer: ${layerId}`);
    }

    const baseUrl = wmsConfig.baseUrl.replace('/wms', '/wfs');

    const params = {
        service: 'WFS',
        version: '1.1.0',
        request: 'GetFeature',
        typeName: wmsConfig.layerName,
        outputFormat: format.id,
        srsName: 'EPSG:4326'
    };

    if (applyFilters) {
        const filters = [];

        if (wmsConfig.cqlFilter) {
            filters.push(wmsConfig.cqlFilter);
        }

        if (getFilter) {
            const dynamicFilter = getFilter(layerId);
            if (dynamicFilter) {
                filters.push(dynamicFilter);
            }
        }

        const combinedFilter = combineCQLFilters(...filters);
        if (combinedFilter) {
            params.CQL_FILTER = combinedFilter;
        }
    }

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    return url.toString();
};

const fetchLayerData = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.blob();
};

const getActiveSubLayers = (layerId, activeLayerIds) => {
    const layer = findLayerById(layerId, layers);
    if (!layer) return [];

    const allSubLayers = collectLayersWithWMS(layer);
    const activeIdSet = new Set(activeLayerIds);

    return allSubLayers.filter(subLayer =>
        activeIdSet.has(subLayer.id) && findWMSConfig(subLayer.id, layers)
    );
};

export const downloadLayer = async (layerId, format, options = {}) => {
    try {
        const { applyFilters = true, getFilter = null, activeLayerIds = [] } = options;

        const wmsConfig = findWMSConfig(layerId, layers);

        if (!wmsConfig) {
            const activeSubLayers = getActiveSubLayers(layerId, activeLayerIds);

            if (activeSubLayers.length === 0) {
                throw new Error('No se encontraron subcapas activas con configuración WMS');
            }

            if (activeSubLayers.length === 1) {
                const url = buildDownloadURL(activeSubLayers[0].id, format, { applyFilters, getFilter });
                triggerDownload(url, `${activeSubLayers[0].id}.${format.extension}`);
                return { success: true };
            }

            const zip = new JSZip();
            for (const subLayer of activeSubLayers) {
                const url = buildDownloadURL(subLayer.id, format, { applyFilters, getFilter });
                const blob = await fetchLayerData(url);
                zip.file(`${subLayer.id}.${format.extension}`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            triggerDownload(zipUrl, `${layerId}.zip`);
            URL.revokeObjectURL(zipUrl);

            return { success: true };
        }

        const url = buildDownloadURL(layerId, format, { applyFilters, getFilter });
        triggerDownload(url, `${layerId}.${format.extension}`);

        return { success: true };
    } catch (error) {
        console.error('Error downloading layer:', error);
        return { success: false, error: error.message };
    }
};

const triggerDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
