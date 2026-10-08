export const FORMATOS_NUMERICOS = new Set(['entero', 'decimal', 'moneda']);

const escapar = (valor) => String(valor).replace(/'/g, "''");

const comillas = (valor) => `'${escapar(valor)}'`;

const listaCql = (columna, descriptor) => {
    const valores = (descriptor.valores || []).filter(v => v !== null && v !== undefined && v !== '');
    if (valores.length === 0) return null;
    if (valores.length === 1) return `${columna} = ${comillas(valores[0])}`;
    return `${columna} IN (${valores.map(comillas).join(',')})`;
};

const textoCql = (columna, descriptor) => {
    const termino = (descriptor.contiene || '').trim();
    if (!termino) return null;
    return `${columna} ILIKE '%${escapar(termino)}%'`;
};

const numeroCql = (columna, descriptor) => {
    const partes = [];
    if (Number.isFinite(descriptor.min)) partes.push(`${columna} >= ${descriptor.min}`);
    if (Number.isFinite(descriptor.max)) partes.push(`${columna} <= ${descriptor.max}`);
    if (partes.length === 0) return null;
    return partes.join(' AND ');
};

const fechaCql = (columna, descriptor) => {
    const partes = [];
    if (descriptor.desde) partes.push(`${columna} >= ${comillas(descriptor.desde)}`);
    if (descriptor.hasta) partes.push(`${columna} < ${comillas(descriptor.hasta)}`);
    if (partes.length === 0) return null;
    return partes.join(' AND ');
};

const booleanoCql = (columna, descriptor) => {
    if (descriptor.valor !== true && descriptor.valor !== false) return null;
    return `${columna} = ${descriptor.valor ? 'true' : 'false'}`;
};

const POR_FAMILIA = {
    lista: listaCql,
    texto: textoCql,
    numero: numeroCql,
    fecha: fechaCql,
    booleano: booleanoCql,
};

export const construirCqlColumna = (columna, descriptor) => {
    if (!columna || !descriptor) return null;
    const constructor = POR_FAMILIA[descriptor.familia];
    if (!constructor) return null;
    return constructor(columna, descriptor);
};

export const combinar = (expresiones) => {
    const validas = (expresiones || []).filter(Boolean);
    if (validas.length === 0) return null;
    if (validas.length === 1) return validas[0];
    return validas.map(expresion => `(${expresion})`).join(' AND ');
};

export const construirCql = (filtros) => {
    if (!filtros) return null;
    return combinar(
        Object.entries(filtros).map(([columna, descriptor]) => construirCqlColumna(columna, descriptor)),
    );
};

export const construirBbox = (campoGeometria, extent, srs) => {
    if (!campoGeometria || !Array.isArray(extent) || extent.length !== 4) return null;
    if (!extent.every(Number.isFinite)) return null;
    const [xmin, ymin, xmax, ymax] = extent;
    return `BBOX(${campoGeometria}, ${xmin}, ${ymin}, ${xmax}, ${ymax}, '${srs}')`;
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

export const cqlDeIds = (ids) => {
    const validos = (ids || []).filter(Boolean);
    if (validos.length === 0) return null;
    return `IN (${validos.map(id => `'${String(id).replace(/'/g, "''")}'`).join(',')})`;
};
