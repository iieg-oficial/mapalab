import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { fetchGeometryColumns, getWfsUrl } from '../utils/featureInfoUtils';

export const MAX_VERTICES = 120;
const TIEMPO_LIMITE_MS = 8000;
const PROYECCION = 'EPSG:3857';

export const wktDelPoligono = (geometria, maxVertices = MAX_VERTICES) => {
    const [minX, minY, maxX, maxY] = geometria.getExtent();
    const paso = Math.max(maxX - minX, maxY - minY) / 500 || 1;
    let anillo = geometria.getCoordinates()[0];
    let tolerancia = 0;

    while (anillo.length > maxVertices && tolerancia < paso * 500) {
        tolerancia += paso;
        anillo = geometria.simplify(tolerancia).getCoordinates()[0];
    }

    const puntos = anillo.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join(',');
    return `POLYGON((${puntos}))`;
};

export const filtroDePoligono = (columna, wkt) => `INTERSECTS(${columna}, SRID=3857;${wkt})`;

export const leerNumberMatched = (xml) => {
    const encontrado = /numberMatched="(\d+)"/.exec(xml || '');
    return encontrado ? Number(encontrado[1]) : null;
};

const contarCapa = async ({ baseUrl, typeName, columna, filtroCapa, wkt }) => {
    const espacial = filtroDePoligono(columna, wkt);
    const cuerpo = new URLSearchParams({
        SERVICE: 'WFS',
        VERSION: '2.0.0',
        REQUEST: 'GetFeature',
        TYPENAMES: typeName,
        SRSNAME: PROYECCION,
        RESULTTYPE: 'hits',
        CQL_FILTER: filtroCapa ? `(${filtroCapa}) AND ${espacial}` : espacial,
    });

    const respuesta = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: cuerpo.toString(),
        signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    });
    if (!respuesta.ok) return null;
    return leerNumberMatched(await respuesta.text());
};

export const contarEnPoligono = async (capas = [], poligono, { getFilter = null, allLayers = [] } = {}) => {
    if (!poligono || capas.length === 0) return [];
    const wkt = wktDelPoligono(poligono);

    return Promise.all(capas.map(async (capa) => {
        const fila = { id: capa.id, etiqueta: capa.label || capa.name || capa.id, conteo: null };
        const wmsConfig = findWMSConfig(capa.id, allLayers);
        if (!wmsConfig || wmsConfig.wfsAvailable === false) return fila;

        try {
            const baseUrl = getWfsUrl(wmsConfig.baseUrl);
            const typeName = wmsConfig.layerName;
            const columnas = await fetchGeometryColumns(baseUrl, [typeName]);
            const conteo = await contarCapa({
                baseUrl,
                typeName,
                columna: columnas[typeName] || 'the_geom',
                filtroCapa: getFilter ? getFilter(capa.id) : null,
                wkt,
            });
            return { ...fila, conteo };
        } catch {
            return fila;
        }
    }));
};
