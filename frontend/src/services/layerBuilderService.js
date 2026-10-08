import { getLayerRequestParams } from '@services/layerMetadataService';

const API_HOST = import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');
const CAMPOS_ENDPOINT = `${API_HOST}/metadata/campos`;
const CALCULO_ENDPOINT = `${API_HOST}/metadata/personalizada`;

const conCapa = (endpoint, layerId, context) => {
    const params = getLayerRequestParams(layerId);
    if (!params) return null;
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set('workspace', params.workspace);
    url.searchParams.set('layer', params.layer);
    if (context?.claves?.length) url.searchParams.set('municipio', context.claves.slice().sort().join(','));
    if (context?.fechaInicio) url.searchParams.set('fecha_inicio', context.fechaInicio);
    if (context?.fechaFin) url.searchParams.set('fecha_fin', context.fechaFin);
    return url;
};

export const getLayerCampos = async (layerId) => {
    if (!API_HOST) return null;
    const url = conCapa(CAMPOS_ENDPOINT, layerId, null);
    if (!url) return null;

    const response = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json' } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return response.json();
};

export const calcularPersonalizada = async (layerId, definicion, context = null) => {
    if (!API_HOST) return null;
    const url = conCapa(CALCULO_ENDPOINT, layerId, context);
    if (!url) return null;

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definicion),
    });
    if (!response.ok) return null;
    return response.json();
};
