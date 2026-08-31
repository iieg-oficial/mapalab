import { buildVectorWFSUrl } from '@services/vectorLayerService';
import { getLayerRequestParams } from '@services/layerMetadataService';

const API_HOST = import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');
const COLUMNAS_ENDPOINT = `${API_HOST}/metadata/columnas`;

export const TAMANO_PAGINA = 100;
export const MAX_PAGINAS = 200;

const EXCEPCION = /<(?:ows:)?ExceptionText[^>]*>([\s\S]*?)<\/(?:ows:)?ExceptionText>/i;

const mensajeDeEstado = (status) => {
    if (status === 400) return 'El servicio no pudo resolver la consulta de esta capa';
    if (status === 404) return 'El servicio no encontró esta capa';
    if (status >= 500) return 'El servicio de datos no está respondiendo';
    return `El servicio respondió ${status}`;
};

const leerRespuesta = async (response) => {
    const cuerpo = await response.text();
    const fallo = EXCEPCION.exec(cuerpo);
    if (fallo) throw new Error(fallo[1].trim());
    if (!response.ok) throw new Error(mensajeDeEstado(response.status));

    try {
        return JSON.parse(cuerpo);
    } catch {
        throw new Error('El servicio devolvió una respuesta que no se pudo leer');
    }
};

export const construirOrden = (orden) => {
    if (!orden?.columna) return null;
    return `${orden.columna} ${orden.descendente ? 'D' : 'A'}`;
};

export const fetchPagina = async (wmsConfig, {
    cql, pagina = 0, tamano = TAMANO_PAGINA, orden = null, ordenPorDefecto = null, signal,
} = {}) => {
    const extra = { count: String(tamano) };
    const sortBy = construirOrden(orden);

    if (pagina > 0) {
        extra.startIndex = String(pagina * tamano);
        const estable = sortBy || (ordenPorDefecto ? `${ordenPorDefecto} A` : null);
        if (estable) extra.sortBy = estable;
    } else if (sortBy) {
        extra.sortBy = sortBy;
    }

    const url = buildVectorWFSUrl(wmsConfig, cql || null, extra);
    const datos = await leerRespuesta(await fetch(url, { signal }));

    return {
        features: Array.isArray(datos?.features) ? datos.features : [],
        totalDeclarado: Number.isFinite(datos?.totalFeatures) ? datos.totalFeatures : null,
    };
};

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
