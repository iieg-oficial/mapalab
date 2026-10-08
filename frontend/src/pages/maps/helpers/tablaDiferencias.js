export const LLAVES_PREFERIDAS = ['clave_municipio', 'clave_geo', 'fid'];

export const TOPE_UNION = 5000;

export const elegirLlave = (columnas = []) => LLAVES_PREFERIDAS.find(llave => columnas.includes(llave)) || null;

const aNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numero) ? numero : null;
};

export const camposComparables = (features = [], llave = null) => {
    const candidatos = new Map();
    features.forEach((feature) => {
        const propiedades = feature?.properties || {};
        Object.entries(propiedades).forEach(([nombre, valor]) => {
            if (nombre === llave || LLAVES_PREFERIDAS.includes(nombre)) return;
            if (aNumero(valor) === null) {
                candidatos.set(nombre, false);
                return;
            }
            if (!candidatos.has(nombre)) candidatos.set(nombre, true);
        });
    });
    return [...candidatos.entries()].filter(([, sirve]) => sirve).map(([nombre]) => nombre);
};

const indexar = (features, llave) => {
    const porLlave = new Map();
    features.forEach((feature) => {
        const valor = feature?.properties?.[llave];
        if (valor === null || valor === undefined || valor === '') return;
        const clave = String(valor);
        if (!porLlave.has(clave)) porLlave.set(clave, feature);
    });
    return porLlave;
};

export const unirLados = ({ alfa = [], beta = [], llave, campo }) => {
    if (!llave || !campo) return { filas: [], resumen: null };

    const enAlfa = indexar(alfa, llave);
    const enBeta = indexar(beta, llave);
    const claves = [...new Set([...enAlfa.keys(), ...enBeta.keys()])];

    const filas = claves.map((clave) => {
        const ladoAlfa = enAlfa.get(clave) || null;
        const ladoBeta = enBeta.get(clave) || null;
        const valorAlfa = aNumero(ladoAlfa?.properties?.[campo]);
        const valorBeta = aNumero(ladoBeta?.properties?.[campo]);
        const comparable = valorAlfa !== null && valorBeta !== null;
        return {
            llave: clave,
            propiedades: (ladoAlfa || ladoBeta)?.properties || {},
            alfa: valorAlfa,
            beta: valorBeta,
            delta: comparable ? valorBeta - valorAlfa : null,
            soloEn: ladoAlfa && ladoBeta ? null : (ladoAlfa ? 'A' : 'B'),
        };
    });

    const comparables = filas.filter(fila => fila.delta !== null);
    return {
        filas,
        resumen: {
            total: filas.length,
            comparables: comparables.length,
            subieron: comparables.filter(fila => fila.delta > 0).length,
            bajaron: comparables.filter(fila => fila.delta < 0).length,
            iguales: comparables.filter(fila => fila.delta === 0).length,
            sinPar: filas.filter(fila => fila.soloEn !== null).length,
        },
    };
};

export const ordenarPorDelta = (filas = [], direccion = 'desc') => {
    const conDelta = filas.filter(fila => fila.delta !== null);
    const sinDelta = filas.filter(fila => fila.delta === null);
    const signo = direccion === 'asc' ? 1 : -1;
    conDelta.sort((a, b) => signo * (a.delta - b.delta));
    return [...conDelta, ...sinDelta];
};

export const soloLosQueCambiaron = (filas = []) => filas.filter(fila => fila.delta === null || fila.delta !== 0);
