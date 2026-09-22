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

const BASE_GEOSERVER = (import.meta.env.VITE_GEOSERVER_URL || '/sextante/').replace(/\/+$/, '');
const TIPOS_NUMERICOS = ['xsd:number', 'xsd:decimal', 'xsd:double', 'xsd:int', 'xsd:integer', 'xsd:long', 'xsd:short', 'xsd:float'];

export const esCampoNumerico = (propiedad) => TIPOS_NUMERICOS.includes(propiedad?.localType ? `xsd:${propiedad.localType}` : propiedad?.type);

export const camposNumericos = async (capa, allLayers = []) => {
    const wmsConfig = findWMSConfig(capa?.id, allLayers);
    if (!wmsConfig || wmsConfig.wfsAvailable === false) return [];

    const url = new URL(getWfsUrl(wmsConfig.baseUrl), window.location.origin);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '2.0.0');
    url.searchParams.set('request', 'DescribeFeatureType');
    url.searchParams.set('typeNames', wmsConfig.layerName);
    url.searchParams.set('outputFormat', 'application/json');

    try {
        const respuesta = await fetch(url.toString(), { signal: AbortSignal.timeout(TIEMPO_LIMITE_MS) });
        if (!respuesta.ok) return [];
        const datos = await respuesta.json();
        const propiedades = datos?.featureTypes?.[0]?.properties || [];
        return propiedades.filter(esCampoNumerico).map(({ name }) => name);
    } catch {
        return [];
    }
};

export const construirAgregado = ({ typeName, campo, cql }) => {
    const href = `http://geoserver/wfs?service=WFS&amp;version=1.0.0&amp;request=GetFeature`
        + `&amp;typeName=${typeName}&amp;CQL_FILTER=${encodeURIComponent(cql)}`;
    const funciones = ['Count', 'Sum', 'Average']
        .map(f => `<wps:Input><ows:Identifier>function</ows:Identifier><wps:Data><wps:LiteralData>${f}</wps:LiteralData></wps:Data></wps:Input>`)
        .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<wps:Execute version="1.0.0" service="WPS" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
<ows:Identifier>gs:Aggregate</ows:Identifier>
<wps:DataInputs>
<wps:Input><ows:Identifier>features</ows:Identifier><wps:Reference mimeType="text/xml; subtype=wfs-collection/1.0" xlink:href="${href}" method="GET"/></wps:Input>
<wps:Input><ows:Identifier>aggregationAttribute</ows:Identifier><wps:Data><wps:LiteralData>${campo}</wps:LiteralData></wps:Data></wps:Input>
${funciones}
<wps:Input><ows:Identifier>singlePass</ows:Identifier><wps:Data><wps:LiteralData>true</wps:LiteralData></wps:Data></wps:Input>
</wps:DataInputs>
<wps:ResponseForm><wps:RawDataOutput mimeType="application/json"><ows:Identifier>result</ows:Identifier></wps:RawDataOutput></wps:ResponseForm>
</wps:Execute>`;
};

export const leerAgregado = (datos) => {
    const funciones = datos?.AggregationFunctions;
    const valores = datos?.AggregationResults?.[0];
    if (!Array.isArray(funciones) || !Array.isArray(valores)) return null;
    const dato = (nombre) => {
        const valor = valores[funciones.indexOf(nombre)];
        return typeof valor === 'number' ? valor : null;
    };
    return { conteo: dato('Count'), suma: dato('Sum'), promedio: dato('Average') };
};

export const agregarEnPoligono = async ({ capa, campo, poligono, getFilter = null, allLayers = [] }) => {
    const wmsConfig = findWMSConfig(capa?.id, allLayers);
    if (!campo || !poligono || !wmsConfig || wmsConfig.wfsAvailable === false) return null;

    try {
        const baseUrl = getWfsUrl(wmsConfig.baseUrl);
        const typeName = wmsConfig.layerName;
        const columnas = await fetchGeometryColumns(baseUrl, [typeName]);
        const espacial = filtroDePoligono(columnas[typeName] || 'the_geom', wktDelPoligono(poligono));
        const filtroCapa = getFilter ? getFilter(capa.id) : null;

        const respuesta = await fetch(`${BASE_GEOSERVER}/ows`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml' },
            body: construirAgregado({ typeName, campo, cql: filtroCapa ? `(${filtroCapa}) AND ${espacial}` : espacial }),
            signal: AbortSignal.timeout(TIEMPO_LIMITE_MS * 2),
        });
        if (!respuesta.ok) return null;
        return leerAgregado(await respuesta.json());
    } catch {
        return null;
    }
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
