let actual = null;
const oyentes = new Set();

export const fijarCapaResaltada = (layerId) => {
    const siguiente = layerId ?? null;
    if (siguiente === actual) return;
    actual = siguiente;
    oyentes.forEach((fn) => fn(actual));
};

export const soltarCapaResaltada = (layerId) => {
    if (actual === layerId) fijarCapaResaltada(null);
};

export const suscribirCapaResaltada = (fn) => {
    oyentes.add(fn);
    return () => oyentes.delete(fn);
};
