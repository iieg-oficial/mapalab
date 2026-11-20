const MODOS = ['resumen', 'comparar', 'ranking'];
const MAX_COMPARADOS = 6;

let pendiente = null;
const oyentes = new Set();

const claves = (lista) => (Array.isArray(lista) ? lista : [])
    .map(String)
    .filter(clave => /^\d{1,5}$/.test(clave))
    .slice(0, MAX_COMPARADOS);

export const serializarEstadisticas = (panel, slugDe) => {
    if (!panel?.abierto || !panel.detachedLayerId) return null;
    const capa = slugDe(panel.detachedLayerId);
    if (!capa) return null;
    const modo = MODOS.includes(panel.modo) ? panel.modo : 'resumen';
    const comparados = modo === 'comparar' ? claves(panel.clavesComparadas) : [];
    return {
        capa,
        ...(modo !== 'resumen' ? { modo } : {}),
        ...(comparados.length ? { comparados } : {}),
    };
};

export const leerEstadisticas = (crudo, idDe) => {
    if (!crudo || typeof crudo !== 'object' || typeof crudo.capa !== 'string') return null;
    const layerId = idDe(crudo.capa);
    if (!layerId) return null;
    return {
        layerId,
        modo: MODOS.includes(crudo.modo) ? crudo.modo : 'resumen',
        comparados: claves(crudo.comparados),
    };
};

export const pedirEstadisticas = (estadisticas) => {
    pendiente = estadisticas;
    oyentes.forEach(oyente => oyente());
};

export const tomarEstadisticas = () => {
    const estadisticas = pendiente;
    pendiente = null;
    return estadisticas;
};

export const suscribirEstadisticas = (oyente) => {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
};
