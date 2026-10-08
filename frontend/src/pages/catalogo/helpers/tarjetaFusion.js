const TIPOS_CUERPO = ['labelGroups', 'list', 'iconText', 'text', 'cards'];
export const TIPOS_EDITABLES = ['list', 'cards', 'text'];
const CLAVES_EDITABLES = ['headerField', 'list', 'cards', 'text'];

const CONTACTO = new RegExp(
    '(https?://|www\\.|\\S+@\\S+\\.\\S+'
    + '|\\b[\\w-]+\\.(?:com|net|org|mx|io|info|xyz|site|online|me|ly|app|link|biz|co)\\b'
    + '|(?:\\+?\\d[\\s().-]*){10,})',
    'i',
);

export const textoConContacto = (texto) => typeof texto === 'string' && CONTACTO.test(texto);

const esInstanciado = (valor) => Array.isArray(valor)
    && valor.length > 0
    && valor[0] && typeof valor[0] === 'object'
    && typeof valor[0].id === 'string'
    && Array.isArray(valor[0].items);

const normalizarLlave = (llave) => (llave === 'text' ? 'text:t0' : llave);

export const tipoDeLlave = (llave) => String(llave).split(':')[0];

export const esEditable = (llave) => TIPOS_EDITABLES.includes(tipoDeLlave(llave));

export const llavesPresentes = (config) => {
    const llaves = [];
    TIPOS_CUERPO.forEach((tipo) => {
        const valor = config?.[tipo];
        if (tipo === 'labelGroups' && config?.labels && !valor) {
            llaves.push('labelGroups');
            return;
        }
        if (!valor || (Array.isArray(valor) && valor.length === 0)) return;
        if (esInstanciado(valor)) valor.forEach((bloque) => llaves.push(`${tipo}:${bloque.id}`));
        else llaves.push(normalizarLlave(tipo));
    });
    return llaves;
};

export const ordenBase = (config) => {
    const presentes = llavesPresentes(config || {});
    const explicito = (config?.blockOrder || [])
        .map(normalizarLlave)
        .filter((llave) => presentes.includes(llave));
    return [...explicito, ...presentes.filter((llave) => !explicito.includes(llave))];
};

export const ordenFusionado = (base, propuesta) => {
    const resultado = [...(propuesta?.blockOrder || llavesPresentes(propuesta || {}))];
    ordenBase(base).forEach((llave, indice) => {
        if (!esEditable(llave) && !resultado.includes(llave)) {
            resultado.splice(Math.min(indice, resultado.length), 0, llave);
        }
    });
    return resultado;
};

export const fusionarConfig = (base, propuesta) => {
    const fusion = Object.fromEntries(
        Object.entries(base && typeof base === 'object' ? base : {})
            .filter(([clave]) => !CLAVES_EDITABLES.includes(clave) && clave !== 'blockOrder'),
    );
    CLAVES_EDITABLES.forEach((clave) => {
        const valor = propuesta?.[clave];
        if (valor && (!Array.isArray(valor) || valor.length)) fusion[clave] = valor;
    });
    const orden = ordenFusionado(base, propuesta);
    if (orden.length) fusion.blockOrder = orden;
    return fusion;
};
