import { findLayerById, layers } from '@pages/maps/helpers/layers';

const API_HOST = import.meta.env.VITE_BACKEND_API_HOST.replace(/\/+$/, '');
const PERIODICITY_ENDPOINT = `${API_HOST}/mapalab/periodicity`;


const extractWorkspaceFromBaseUrl = (baseUrl) => {
    if (!baseUrl) return null;

    try {
        const url = new URL(baseUrl);
        const segments = url.pathname.split('/').filter(Boolean);
        const wmsIndex = segments.lastIndexOf('wms');
        if (wmsIndex > 0) {
            return segments[wmsIndex - 1];
        }
    } catch {
        const segments = baseUrl.split('/').filter(Boolean);
        const wmsIndex = segments.lastIndexOf('wms');
        if (wmsIndex > 0) {
            return segments[wmsIndex - 1];
        }
    }

    return null;
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

const getLayerRequestParams = (layerId) => {
    const layerNode = findLayerById(layerId, layers);
    if (!layerNode) return null;

    const layerWithConfig = findLayerWithWMS(layerNode);
    if (!layerWithConfig || !layerWithConfig.wmsConfig) return null;

    const { wmsConfig } = layerWithConfig;
    const layerName = wmsConfig.layerName?.split(':').pop();
    const workspaceFromUrl = extractWorkspaceFromBaseUrl(wmsConfig.baseUrl);
    const workspace = workspaceFromUrl || wmsConfig.workspace;
    const cqlFilter = wmsConfig.cqlFilter || null;

    if (!workspace || !layerName) return null;

    return {
        workspace,
        layer: layerName,
        cqlFilter,
        layerId: layerWithConfig.id
    };
};

export const getLayerPeriodicity = async (layerId, options = {}) => {
    const params = getLayerRequestParams(layerId);
    if (!params) {
        console.warn(`No se encontró configuración WMS para la capa ${layerId}`);
        return {
            layerId,
            fecha: null
        };
    }

    const url = new URL(PERIODICITY_ENDPOINT);
    url.searchParams.set('workspace', params.workspace);
    url.searchParams.set('layer', params.layer);

    const effectiveCqlFilter = options.cqlFilter ?? params.cqlFilter ?? null;

    if (effectiveCqlFilter) {
        url.searchParams.set('cql_filter', effectiveCqlFilter);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Error al obtener periodicidad: ${response.status}`);
        }

        const data = await response.json();

        return {
            layerId,
            filterColumn: 'fecha',
            ...data
        };
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`Tiempo de espera agotado para la capa ${layerId}`);
        } else {
            console.error('Error en getLayerPeriodicity:', error);
        }
        return {
            layerId,
            fecha: null,
            filterColumn: 'fecha'
        };
    } finally {
        clearTimeout(timeoutId);
    }
};
