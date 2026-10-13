import { getLayerRequestParams } from '@services/layerMetadataService';

const API_HOST = import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');
const COLUMNAS_ENDPOINT = `${API_HOST}/metadata/columnas`;

export const TAMANO_PAGINA = 100;
export const MAX_PAGINAS = 200;

export const fetchConfigColumnas = async (layerId, signal) => {
    if (!API_HOST) return [];
    const params = getLayerRequestParams(layerId);
    if (!params) return [];

    const url = new URL(COLUMNAS_ENDPOINT, window.location.origin);
    url.searchParams.set('workspace', params.workspace);
    url.searchParams.set('layer', params.layer);

    try {
        const response = await fetch(url.toString(), { signal });
        if (!response.ok) return [];
        const datos = await response.json();
        return Array.isArray(datos?.columnas) ? datos.columnas : [];
    } catch (error) {
        if (error?.name === 'AbortError') throw error;
        return [];
    }
};

export const ordenarColumnas = (nombres, configuracion) => {
    const porNombre = new Map((configuracion || []).map(item => [item.columna, item]));
    return (nombres || [])
        .map((nombre, indice) => {
            const config = porNombre.get(nombre);
            return {
                nombre,
                etiqueta: config?.alias || nombre,
                visible: config ? config.visible !== false : true,
                formato: config?.formato || null,
                orden: config && Number.isFinite(config.orden) ? config.orden : indice,
            };
        })
        .sort((a, b) => a.orden - b.orden);
};
