import { findLayerById } from '@pages/maps/helpers/layers/utils/layerHelpers';

let currentLayers = [];

export const setLayersForMetadataService = (newLayers) => {
    currentLayers = Array.isArray(newLayers) ? newLayers : [];
};

const API_HOST = import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');
const METADATA_ENDPOINT = `${API_HOST}/metadata/`;
const SOURCES_ENDPOINT = `${API_HOST}/metadata/sources`;
const PERIODICITY_ENDPOINT = `${API_HOST}/periodicity/`;
const PERIODICITY_BATCH_ENDPOINT = `${API_HOST}/periodicity/batch`;

const cleanNaN = (value) => (value === 'NaN' ? null : value);

const cleanResponse = (data) => {
    if (data == null) return data;
    if (typeof data === 'string') return cleanNaN(data);
    if (Array.isArray(data)) return data.map(cleanResponse);
    if (typeof data === 'object') {
        return Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, cleanResponse(v)])
        );
    }
    return data;
};

const filterNumeralia = (numeralia) => {
    if (!Array.isArray(numeralia)) return [];
    return numeralia.filter(item => item.valor != null || item.nombre != null);
};

const findLayerWithWMS = (layer) => {
    if (!layer) return null;
    if (layer.wmsConfig) return layer;
    if (Array.isArray(layer.children)) {
        for (const child of layer.children) {
            const found = findLayerWithWMS(child);
            if (found) return found;
        }
    }
    return null;
};

const extractWorkspaceFromBaseUrl = (baseUrl) => {
    if (!baseUrl) return null;
    try {
        const url = new URL(baseUrl);
        const segments = url.pathname.split('/').filter(Boolean);
        const wmsIndex = segments.lastIndexOf('wms');
        if (wmsIndex > 0) return segments[wmsIndex - 1];
    } catch {
        const segments = baseUrl.split('/').filter(Boolean);
        const wmsIndex = segments.lastIndexOf('wms');
        if (wmsIndex > 0) return segments[wmsIndex - 1];
    }
    return null;
};

const getLayerRequestParams = (layerId) => {
    const layerNode = findLayerById(layerId, currentLayers);
    if (!layerNode) return null;

    const layerWithConfig = findLayerWithWMS(layerNode);
    if (!layerWithConfig?.wmsConfig) return null;

    const { wmsConfig } = layerWithConfig;
    const layerName = wmsConfig.metadataLayer || wmsConfig.layerName?.split(':').pop();
    const workspace = extractWorkspaceFromBaseUrl(wmsConfig.baseUrl) || wmsConfig.workspace;

    if (!workspace || !layerName) return null;
    return { workspace, layer: layerName };
};

const getPeriodicityRequestParams = (layerId) => {
    const layerNode = findLayerById(layerId, currentLayers);
    if (!layerNode) return null;

    const layerWithConfig = findLayerWithWMS(layerNode);
    if (!layerWithConfig?.wmsConfig) return null;

    const { wmsConfig } = layerWithConfig;
    const layerName = wmsConfig.layerName?.split(':').pop();
    const workspace = extractWorkspaceFromBaseUrl(wmsConfig.baseUrl) || wmsConfig.workspace;

    if (!workspace || !layerName) return null;
    return { workspace, layer: layerName };
};

export const getLayersSources = async (layerIds) => {
    if (!API_HOST) return {};

    const seen = new Set();
    const entries = layerIds
        .map((id) => {
            const params = getLayerRequestParams(id);
            if (!params) return null;
            return { id, key: `${params.workspace}:${params.layer}` };
        })
        .filter(Boolean)
        .filter(({ key }) => {
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    if (!entries.length) return {};

    const keys = entries.map((e) => e.key).join(',');
    const url = new URL(SOURCES_ENDPOINT, window.location.origin);
    url.searchParams.set('layers', keys);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const results = await response.json();
    const byKey = Object.fromEntries(results.map((r) => [r.nombre_capa_geoserver, r.fuentes_texto_corto ?? null]));

    return Object.fromEntries(entries.map(({ id, key }) => [id, byKey[key] ?? null]));
};

export const getLayerMetadata = async (layerId) => {
    if (!API_HOST) {
        console.error('VITE_BACKEND_API_HOST no está configurado');
        return null;
    }

    const params = getLayerRequestParams(layerId);
    if (!params) {
        console.warn(`No se encontró configuración WMS para la capa ${layerId}`);
        return null;
    }

    const url = new URL(METADATA_ENDPOINT, window.location.origin);
    url.searchParams.set('workspace', params.workspace);
    url.searchParams.set('layer', params.layer);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const raw = await response.json();
        const list = Array.isArray(raw) ? raw : [raw];
        const first = list[0];

        if (!first) return null;

        const data = cleanResponse(first);

        if (data.numeralia) {
            data.numeralia = filterNumeralia(data.numeralia);
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.warn(`Tiempo de espera agotado para la capa ${layerId}`);
        } else {
            console.error('Error al obtener metadata de la capa:', error);
        }
        throw error;
    }
};

export const getLayerPeriodicity = async (layerId) => {
    if (!API_HOST) return null;

    const params = getPeriodicityRequestParams(layerId);
    if (!params) return null;

    const url = new URL(PERIODICITY_ENDPOINT, window.location.origin);
    url.searchParams.set('workspace', params.workspace);
    url.searchParams.set('layer', params.layer);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const data = await response.json();
    return data.periodicity || null;
};

export const getLayersPeriodicities = async (layerIds) => {
    if (!API_HOST) return {};

    const seen = new Set();
    const entries = layerIds
        .map((id) => {
            const params = getPeriodicityRequestParams(id);
            if (!params) return null;
            return { id, key: `${params.workspace}:${params.layer}` };
        })
        .filter(Boolean)
        .filter(({ key }) => {
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

    if (!entries.length) return {};

    const keys = entries.map((e) => e.key).join(',');
    const url = new URL(PERIODICITY_BATCH_ENDPOINT, window.location.origin);
    url.searchParams.set('layers', keys);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const results = await response.json();
    return Object.fromEntries(entries.map(({ id, key }) => [id, results[key] ?? null]));
};
