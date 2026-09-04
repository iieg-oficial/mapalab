import { buildWFSUrl, findVectorFormat } from '@services/downloadUrls';

export const FORMATOS_TABLA = ['csv', 'geopackage'];

const SIN_ACENTOS = /[̀-ͯ]/g;

export const nombreDeArchivo = (nombreCapa, formato) => {
    const limpio = String(nombreCapa || 'tabla')
        .normalize('NFD')
        .replace(SIN_ACENTOS, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'tabla';
    return `${limpio}.${formato.extension}`;
};

export const columnasParaDescarga = ({ formatoId, columnas, soloVisibles, campoGeometria }) => {
    if (!soloVisibles) return null;
    const nombres = (columnas || []).filter(columna => columna.visible).map(columna => columna.nombre);
    if (nombres.length === 0) return null;
    if (formatoId === 'csv') return nombres;
    return campoGeometria ? [...nombres, campoGeometria] : null;
};

export const construirDescarga = ({ wmsConfig, formatoId, cql, columnas, soloVisibles, campoGeometria, nombreCapa }) => {
    const formato = findVectorFormat(formatoId);
    if (!wmsConfig || !formato) return null;

    const propiedades = columnasParaDescarga({ formatoId, columnas, soloVisibles, campoGeometria });
    return {
        url: buildWFSUrl(wmsConfig, formato, cql || null, propiedades),
        archivo: nombreDeArchivo(nombreCapa, formato),
    };
};
