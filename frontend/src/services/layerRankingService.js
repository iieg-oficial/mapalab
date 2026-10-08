import { getLayerRequestParams } from '@services/layerMetadataService';

const API_HOST = import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');
const RANKING_ENDPOINT = `${API_HOST}/metadata/ranking`;

export const getLayerRanking = async (layerId, context = null) => {
    if (!API_HOST) return null;

    const params = getLayerRequestParams(layerId);
    if (!params) return null;

    const url = new URL(RANKING_ENDPOINT, window.location.origin);
    url.searchParams.set('workspace', params.workspace);
    url.searchParams.set('layer', params.layer);
    if (context?.fechaInicio) url.searchParams.set('fecha_inicio', context.fechaInicio);
    if (context?.fechaFin) url.searchParams.set('fecha_fin', context.fechaFin);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    return response.json();
};
