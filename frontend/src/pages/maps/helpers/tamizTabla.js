import { getWfsUrl } from '@utils/featureInfoUtils';
import { filtrosATamiz } from '@pages/maps/helpers/tablaCqlBuilder';

export const fuenteWfs = (wmsConfig) => {
    const typeName = wmsConfig?.wfsLayerName || wmsConfig?.layerName;
    if (!wmsConfig?.baseUrl || !typeName) return null;
    return { url: getWfsUrl(wmsConfig.baseUrl), typeName, version: '2.0.0' };
};

export const ordenTamiz = (orden) => (orden?.columna
    ? { field: orden.columna, direction: orden.descendente ? 'desc' : 'asc' }
    : null);

const mensajeDeEstado = (status) => {
    if (status === 400) return 'El servicio no pudo resolver la consulta de esta capa';
    if (status === 404) return 'El servicio no encontró esta capa';
    if (status >= 500) return 'El servicio de datos no está respondiendo';
    return `El servicio respondió ${status}`;
};

export const mensajeDeError = (error) => {
    if (!error) return null;
    const generico = /^WFS request failed with HTTP (\d+)$/.exec(error.message || '');
    if (generico) return mensajeDeEstado(Number(generico[1]));
    if (/is not JSON|not a FeatureCollection/.test(error.message || '')) {
        return 'El servicio devolvió una respuesta que no se pudo leer';
    }
    return error.message || 'No se pudieron traer los datos';
};

const contiguas = (paginas) => {
    const filas = [];
    for (let indice = 0; indice < paginas.length; indice += 1) {
        if (!paginas[indice]) break;
        filas.push(...paginas[indice]);
    }
    return filas;
};

export const crearAcumulador = (tabla) => {
    let llave = null;
    let paginas = [];
    let filas = [];
    let ultimo = null;

    const calcular = () => {
        const snapshot = tabla.getSnapshot();
        if (snapshot === ultimo) return;
        ultimo = snapshot;
        const nueva = JSON.stringify([snapshot.cql, snapshot.sort, snapshot.pageSize]);
        if (nueva !== llave) {
            llave = nueva;
            paginas = [];
            filas = [];
        }
        if (snapshot.status !== 'ready' || paginas[snapshot.page] === snapshot.rows) return;
        paginas = [...paginas];
        paginas[snapshot.page] = snapshot.rows;
        filas = contiguas(paginas);
    };

    return {
        subscribe: escuchar => tabla.subscribe(() => {
            calcular();
            escuchar();
        }),
        getSnapshot: () => {
            calcular();
            return filas;
        },
    };
};

const vacio = (texto) => texto?.trim() || null;

const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export const sincronizar = (tabla, { base, filtros, expresion, orden, tamano }) => {
    const actual = tabla.getSnapshot();
    if ((actual.baseCql ?? null) !== vacio(base)) tabla.setBaseCql(base);
    const siguientes = filtrosATamiz(filtros);
    if (!igual(actual.filters, siguientes)) {
        Object.keys(actual.filters).filter(columna => !siguientes[columna]).forEach(columna => tabla.setFilter(columna, null));
        Object.entries(siguientes)
            .filter(([columna, filtro]) => !igual(actual.filters[columna], filtro))
            .forEach(([columna, filtro]) => tabla.setFilter(columna, filtro));
    }
    if ((actual.customCql ?? null) !== vacio(expresion)) tabla.setCql(expresion);
    const sort = ordenTamiz(orden);
    if (!igual(actual.sort, sort)) tabla.setSort(sort);
    if (actual.pageSize !== tamano) tabla.setPageSize(tamano);
};
