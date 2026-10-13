export const METODOS_HEXBIN = [
    { valor: 'quantile', texto: 'Cuantiles' },
    { valor: 'jenks', texto: 'Cortes naturales' },
    { valor: 'equalInterval', texto: 'Intervalos iguales' }
];

const REDUCTORES = ['sum', 'mean'];

export const OPCIONES_HEXBIN_BASE = Object.freeze({ campo: null, reductor: 'count', metodo: 'quantile' });

export const normalizarOpciones = (opciones) => {
    const conCampo = REDUCTORES.includes(opciones?.reductor) && typeof opciones?.campo === 'string' && opciones.campo !== '';
    const metodo = METODOS_HEXBIN.some(m => m.valor === opciones?.metodo) ? opciones.metodo : 'quantile';
    return conCampo
        ? { campo: opciones.campo, reductor: opciones.reductor, metodo }
        : { campo: null, reductor: 'count', metodo };
};

export const esOpcionBase = (opciones) => {
    const { reductor, metodo } = normalizarOpciones(opciones);
    return reductor === 'count' && metodo === 'quantile';
};

export const mismasOpciones = (a, b) => {
    const x = normalizarOpciones(a);
    const y = normalizarOpciones(b);
    return x.campo === y.campo && x.reductor === y.reductor && x.metodo === y.metodo;
};

export const valorDeOpciones = (opciones) => {
    const { campo, reductor } = normalizarOpciones(opciones);
    return campo ? `${reductor}:${campo}` : 'count';
};

export const opcionesDeValor = (valor, metodo) => {
    const [reductor, ...resto] = String(valor || 'count').split(':');
    return normalizarOpciones({ reductor, campo: resto.join(':'), metodo });
};

export const opcionesDeValores = (campos = []) => [
    { valor: 'count', texto: 'Conteo de puntos' },
    ...campos.flatMap(campo => [
        { valor: `sum:${campo}`, texto: `Suma de ${campo}` },
        { valor: `mean:${campo}`, texto: `Promedio de ${campo}` }
    ])
];
