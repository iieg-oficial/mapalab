import { and, bboxToCql, filterToCql, filtersToCql, idsToCql, isEmptyFilter } from '@ghegar/tamiz';

export const FORMATOS_NUMERICOS = new Set(['entero', 'decimal', 'moneda']);

const numeroCql = (descriptor) => {
    const { min, max } = descriptor;
    const conMin = Number.isFinite(min);
    const conMax = Number.isFinite(max);
    if (conMin && conMax) return { kind: 'number', op: 'between', min, max };
    if (conMin) return { kind: 'number', op: 'gte', value: min };
    if (conMax) return { kind: 'number', op: 'lte', value: max };
    return null;
};

const fechaCql = (descriptor) => ({
    kind: 'date',
    ...(descriptor.desde ? { from: descriptor.desde } : {}),
    ...(descriptor.hasta ? { before: descriptor.hasta } : {}),
});

const POR_FAMILIA = {
    lista: descriptor => ({ kind: 'list', values: descriptor.valores || [] }),
    texto: descriptor => ({ kind: 'text', op: 'contains', value: (descriptor.contiene || '').trim() }),
    numero: numeroCql,
    fecha: fechaCql,
    booleano: descriptor => (descriptor.valor === true || descriptor.valor === false
        ? { kind: 'boolean', value: descriptor.valor }
        : null),
};

export const aFiltroTamiz = (descriptor) => {
    const traductor = POR_FAMILIA[descriptor?.familia];
    return traductor ? traductor(descriptor) : null;
};

export const filtrosATamiz = (filtros) => Object.fromEntries(
    Object.entries(filtros || {})
        .map(([columna, descriptor]) => [columna, aFiltroTamiz(descriptor)])
        .filter(([, filtro]) => filtro && !isEmptyFilter(filtro)),
);

export const construirCqlColumna = (columna, descriptor) => {
    const filtro = columna ? aFiltroTamiz(descriptor) : null;
    return filtro ? filterToCql(columna, filtro) : null;
};

export const combinar = (expresiones) => and(expresiones || []);

export const construirCql = (filtros) => filtersToCql(filtrosATamiz(filtros));

export const construirBbox = (campoGeometria, extent, srs) => {
    if (!campoGeometria || !Array.isArray(extent) || extent.length !== 4) return null;
    if (!extent.every(Number.isFinite)) return null;
    return bboxToCql(campoGeometria, extent, srs);
};

export const LLAVE_TABLA = 'tabla';
export const LLAVE_SELECCION = 'seleccion';

export const filtrosComunes = (filtrosPorCapa) => {
    const listas = (filtrosPorCapa || []).filter(Boolean);
    if (listas.length === 0) return {};
    const [primera, ...resto] = listas;
    const comunes = {};
    for (const [llave, valor] of Object.entries(primera)) {
        if (resto.every(otra => otra[llave] === valor)) comunes[llave] = valor;
    }
    return comunes;
};

export const filtroHeredado = (filtrosDeCapa, timeEnabled) => {
    if (!filtrosDeCapa) return null;
    const entradas = Object.entries(filtrosDeCapa).filter(([llave, valor]) => {
        if (!valor || llave.startsWith('_')) return false;
        if (llave === LLAVE_TABLA || llave === LLAVE_SELECCION) return false;
        return !(timeEnabled && llave === 'date');
    });
    return combinar(entradas.map(([, valor]) => valor));
};

const listaLegible = (valores) => {
    if (valores.length <= 2) return valores.join(', ');
    return `${valores.length} valores`;
};

export const etiquetaFiltro = (columna, descriptor) => {
    if (!descriptor) return columna;
    switch (descriptor.familia) {
    case 'lista':
        return `${columna}: ${listaLegible(descriptor.valores || [])}`;
    case 'texto':
        return `${columna} contiene "${descriptor.contiene}"`;
    case 'numero': {
        if (Number.isFinite(descriptor.min) && Number.isFinite(descriptor.max)) {
            return `${columna}: ${descriptor.min} a ${descriptor.max}`;
        }
        if (Number.isFinite(descriptor.min)) return `${columna} ≥ ${descriptor.min}`;
        if (Number.isFinite(descriptor.max)) return `${columna} ≤ ${descriptor.max}`;
        return columna;
    }
    case 'fecha': {
        if (descriptor.desde && descriptor.hasta) return `${columna}: ${descriptor.desde} a ${descriptor.hasta}`;
        if (descriptor.desde) return `${columna} desde ${descriptor.desde}`;
        if (descriptor.hasta) return `${columna} antes de ${descriptor.hasta}`;
        return columna;
    }
    case 'booleano':
        return `${columna}: ${descriptor.valor ? 'sí' : 'no'}`;
    default:
        return columna;
    }
};

export const descriptorVacio = (descriptor) => construirCqlColumna('x', descriptor) === null;

export const familiaDeColumna = (columna, campos) => {
    const campo = (campos || []).find(item => item.nombre === columna);
    if (!campo) return 'texto';
    if (campo.tipo === 'numero') return 'numero';
    if (campo.tipo === 'fecha') return 'fecha';
    if (campo.tipo === 'booleano') return 'booleano';
    if (Array.isArray(campo.valores) && campo.valores.length > 0) return 'lista';
    return 'texto';
};

export const cqlDeIds = (ids) => idsToCql((ids || []).filter(Boolean).map(String), null);
