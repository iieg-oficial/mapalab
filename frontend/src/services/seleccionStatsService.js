import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { combineCQLFilters, fetchGeometryColumns, fetchGeometryType, getWfsUrl } from '../utils/featureInfoUtils';
import { sumaPorFraccion } from '../pages/maps/helpers/proporcionArea';

export const MAX_VERTICES = 120;
const TIEMPO_LIMITE_MS = 8000;
const PROYECCION = 'EPSG:3857';

const anillosSimplificados = (poligono, maxVertices) => {
    const [minX, minY, maxX, maxY] = poligono.getExtent();
    const paso = Math.max(maxX - minX, maxY - minY) / 500 || 1;
    const vertices = (geometria) => geometria.getCoordinates().reduce((suma, anillo) => suma + anillo.length, 0);
    let simplificado = poligono;
    let tolerancia = 0;

    while (vertices(simplificado) > maxVertices && tolerancia < paso * 500) {
        tolerancia += paso;
        simplificado = poligono.simplify(tolerancia);
    }
    return simplificado.getCoordinates()
        .map(anillo => `(${anillo.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join(',')})`)
        .join(',');
};

export const wktDelPoligono = (geometria, maxVertices = MAX_VERTICES) => {
    if (geometria.getType() === 'MultiPolygon') {
        const partes = geometria.getPolygons();
        const porParte = Math.max(8, Math.floor(maxVertices / partes.length));
        return `MULTIPOLYGON(${partes.map(parte => `(${anillosSimplificados(parte, porParte)})`).join(',')})`;
    }
    return `POLYGON(${anillosSimplificados(geometria, maxVertices)})`;
};

export const filtroDePoligono = (columna, wkt, relacion = 'INTERSECTS') => `${relacion}(${columna}, SRID=3857;${wkt})`;

export const leerNumberMatched = (xml) => {
    const encontrado = /numberMatched="(\d+)"/.exec(xml || '');
    return encontrado ? Number(encontrado[1]) : null;
};

export const CONTEOS_POR_SEGUNDO = 15;
export const REINTENTOS_TRAS_429 = 2;
const ESPERA_TRAS_429_MS = 1000;
let proximoTurno = 0;

const pausa = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const esperarTurno = () => {
    const ahora = Date.now();
    const turno = Math.max(ahora, proximoTurno);
    proximoTurno = turno + 1000 / CONTEOS_POR_SEGUNDO;
    return turno > ahora ? pausa(turno - ahora) : Promise.resolve();
};

export const pedirConRitmo = async (hacerPeticion) => {
    for (let intento = 0; ; intento += 1) {
        await esperarTurno();
        const respuesta = await hacerPeticion();
        if (respuesta.status !== 429 || intento >= REINTENTOS_TRAS_429) return respuesta;
        await pausa(ESPERA_TRAS_429_MS * (intento + 1));
    }
};

export const urlWfsGet = (baseUrl, parametros) => `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${parametros.toString()}`;

export const filtroDeCapa = (wmsConfig, getFilter, capaId) => combineCQLFilters(
    wmsConfig?.cqlFilter || null,
    getFilter ? getFilter(capaId) : null,
);

const contarCapa = async ({ baseUrl, typeName, columna, filtroCapa, wkt, relacion }) => {
    const espacial = filtroDePoligono(columna, wkt, relacion);
    const cuerpo = new URLSearchParams({
        SERVICE: 'WFS',
        VERSION: '2.0.0',
        REQUEST: 'GetFeature',
        TYPENAMES: typeName,
        SRSNAME: PROYECCION,
        RESULTTYPE: 'hits',
        CQL_FILTER: filtroCapa ? `(${filtroCapa}) AND ${espacial}` : espacial,
    });

    const respuesta = await pedirConRitmo(() => fetch(urlWfsGet(baseUrl, cuerpo), {
        signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    }));
    if (!respuesta.ok) return null;
    return leerNumberMatched(await respuesta.text());
};

const TIPOS_NUMERICOS = ['xsd:number', 'xsd:decimal', 'xsd:double', 'xsd:int', 'xsd:integer', 'xsd:long', 'xsd:short', 'xsd:float'];

const PREFIJOS_LLAVE = ['clave', 'cve', 'id', 'fid', 'gid', 'objectid'];
export const MAX_CLASES = 5;

export const esCampoDeClase = (propiedad) => propiedad?.type === 'xsd:string'
    && !PREFIJOS_LLAVE.some(prefijo => propiedad.name?.toLowerCase().startsWith(prefijo));

export const esCampoNumerico = (propiedad) => TIPOS_NUMERICOS.includes(propiedad?.localType ? `xsd:${propiedad.localType}` : propiedad?.type);

export const camposDeCapa = async (capa, allLayers = []) => {
    const wmsConfig = findWMSConfig(capa?.id, allLayers);
    const vacio = { numericos: [], clases: [] };
    if (!wmsConfig || wmsConfig.wfsAvailable === false) return vacio;

    const url = new URL(getWfsUrl(wmsConfig.baseUrl), window.location.origin);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '2.0.0');
    url.searchParams.set('request', 'DescribeFeatureType');
    url.searchParams.set('typeNames', wmsConfig.layerName);
    url.searchParams.set('outputFormat', 'application/json');

    try {
        const respuesta = await fetch(url.toString(), { signal: AbortSignal.timeout(TIEMPO_LIMITE_MS) });
        if (!respuesta.ok) return vacio;
        const datos = await respuesta.json();
        const propiedades = datos?.featureTypes?.[0]?.properties || [];
        return {
            numericos: propiedades.filter(esCampoNumerico).map(({ name }) => name),
            clases: propiedades.filter(esCampoDeClase).map(({ name }) => name),
        };
    } catch {
        return vacio;
    }
};

export const MAX_ELEMENTOS_AGREGADO = 10000;

export const agregarValores = (valores, porClase = false) => {
    if (porClase) {
        const cuentas = new Map();
        valores.forEach((valor) => {
            if (valor == null || valor === '') return;
            const clase = String(valor);
            cuentas.set(clase, (cuentas.get(clase) || 0) + 1);
        });
        return leerAgregadoPorClase({ AggregationResults: [...cuentas.entries()] });
    }
    const numeros = valores.filter(valor => valor != null && valor !== '').map(Number).filter(Number.isFinite);
    if (numeros.length === 0) return { conteo: 0, suma: null, promedio: null };
    const suma = numeros.reduce((total, valor) => total + valor, 0);
    return { conteo: numeros.length, suma, promedio: suma / numeros.length };
};

export const leerAgregadoPorClase = (datos, maximo = MAX_CLASES) => {
    const filas = datos?.AggregationResults;
    if (!Array.isArray(filas)) return null;
    const clases = filas
        .filter(fila => Array.isArray(fila) && fila[0] != null && typeof fila[1] === 'number')
        .map(([clase, conteo]) => ({ clase: String(clase), conteo }))
        .sort((a, b) => b.conteo - a.conteo);
    const otras = clases.slice(maximo).reduce((suma, { conteo }) => suma + conteo, 0);
    return { clases: clases.slice(0, maximo), otras };
};

export const agregarEnPoligono = async ({ capa, campo, poligono, getFilter = null, allLayers = [], porClase = false }) => {
    const wmsConfig = findWMSConfig(capa?.id, allLayers);
    if (!campo || !poligono || !wmsConfig || wmsConfig.wfsAvailable === false) return null;

    try {
        const baseUrl = getWfsUrl(wmsConfig.baseUrl);
        const typeName = wmsConfig.layerName;
        const columnas = await fetchGeometryColumns(baseUrl, [typeName]);
        const espacial = filtroDePoligono(columnas[typeName] || 'the_geom', wktDelPoligono(poligono), 'WITHIN');
        const filtroCapa = filtroDeCapa(wmsConfig, getFilter, capa.id);

        const parametros = new URLSearchParams({
            SERVICE: 'WFS',
            VERSION: '2.0.0',
            REQUEST: 'GetFeature',
            TYPENAMES: typeName,
            OUTPUTFORMAT: 'application/json',
            PROPERTYNAME: campo,
            COUNT: String(MAX_ELEMENTOS_AGREGADO + 1),
            CQL_FILTER: filtroCapa ? `(${filtroCapa}) AND ${espacial}` : espacial,
        });
        const respuesta = await pedirConRitmo(() => fetch(urlWfsGet(baseUrl, parametros), {
            signal: AbortSignal.timeout(TIEMPO_LIMITE_MS * 3),
        }));
        if (!respuesta.ok) return null;
        const { features = [] } = await respuesta.json();
        if (features.length > MAX_ELEMENTOS_AGREGADO) return null;
        return agregarValores(features.map(feature => feature.properties?.[campo]), porClase);
    } catch {
        return null;
    }
};

export const CAPAS_SIMULTANEAS = 2;

export const conLimite = async (elementos, limite, tarea) => {
    const resultados = new Array(elementos.length);
    let siguiente = 0;
    const trabajador = async () => {
        while (siguiente < elementos.length) {
            const indice = siguiente++;
            resultados[indice] = await tarea(elementos[indice]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limite, elementos.length) }, trabajador));
    return resultados;
};

export const contarEnPoligono = async (capas = [], poligono, { getFilter = null, allLayers = [] } = {}) => {
    if (!poligono || capas.length === 0) return [];
    const wkt = wktDelPoligono(poligono);

    return conLimite(capas, CAPAS_SIMULTANEAS, async (capa) => {
        const fila = { id: capa.id, etiqueta: capa.label || capa.name || capa.id, conteo: null };
        const wmsConfig = findWMSConfig(capa.id, allLayers);
        if (!wmsConfig || wmsConfig.wfsAvailable === false) return { ...fila, sinWfs: true };

        try {
            const baseUrl = getWfsUrl(wmsConfig.baseUrl);
            const typeName = wmsConfig.layerName;
            const columnas = await fetchGeometryColumns(baseUrl, [typeName]);
            const consulta = {
                baseUrl,
                typeName,
                columna: columnas[typeName] || 'the_geom',
                filtroCapa: filtroDeCapa(wmsConfig, getFilter, capa.id),
                wkt,
            };
            const esPunto = await fetchGeometryType(baseUrl, typeName) === 'point';
            const [conteo, tocan] = await Promise.all([
                contarCapa({ ...consulta, relacion: 'WITHIN' }),
                esPunto ? null : contarCapa({ ...consulta, relacion: 'INTERSECTS' }),
            ]);
            const enBorde = conteo != null && tocan != null && tocan > conteo ? tocan - conteo : 0;
            return enBorde ? { ...fila, conteo, enBorde } : { ...fila, conteo };
        } catch {
            return fila;
        }
    });
};

export const contarBorde = (capas, poligono, opciones) => contarEnPoligono(
    capas.map(({ id, name, label }) => ({ id, label: label || name })),
    poligono,
    opciones,
).then(filas => filas.reduce((suma, fila) => suma + (fila.enBorde || 0), 0)).catch(() => 0);

export const MAX_ELEMENTOS_PROPORCION = 2000;

export const sumarProporcional = async ({ capa, campo, poligono, getFilter = null, allLayers = [] }) => {
    const wmsConfig = findWMSConfig(capa?.id, allLayers);
    if (!campo || !poligono || !wmsConfig || wmsConfig.wfsAvailable === false) return null;

    try {
        const baseUrl = getWfsUrl(wmsConfig.baseUrl);
        const typeName = wmsConfig.layerName;
        const columnas = await fetchGeometryColumns(baseUrl, [typeName]);
        if (await fetchGeometryType(baseUrl, typeName) !== 'polygon') return null;
        const columna = columnas[typeName] || 'the_geom';
        const espacial = filtroDePoligono(columna, wktDelPoligono(poligono));
        const filtroCapa = filtroDeCapa(wmsConfig, getFilter, capa.id);
        const cuerpo = new URLSearchParams({
            SERVICE: 'WFS',
            VERSION: '2.0.0',
            REQUEST: 'GetFeature',
            TYPENAMES: typeName,
            OUTPUTFORMAT: 'application/json',
            SRSNAME: PROYECCION,
            PROPERTYNAME: `${columna},${campo}`,
            COUNT: String(MAX_ELEMENTOS_PROPORCION + 1),
            CQL_FILTER: filtroCapa ? `(${filtroCapa}) AND ${espacial}` : espacial,
        });

        const respuesta = await fetch(urlWfsGet(baseUrl, cuerpo), {
            signal: AbortSignal.timeout(TIEMPO_LIMITE_MS * 3),
        });
        if (!respuesta.ok) return null;
        const { features = [] } = await respuesta.json();
        if (features.length > MAX_ELEMENTOS_PROPORCION) return null;
        return sumaPorFraccion(features, campo, poligono.getCoordinates());
    } catch {
        return null;
    }
};
