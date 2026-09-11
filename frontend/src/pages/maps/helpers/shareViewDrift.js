const TOLERANCIA_GRADOS = 0.0001;
const TOLERANCIA_ZOOM = 0.01;

export const vistaCambio = (base, actual) => {
    if (!base || !actual) return false;
    return Math.abs(base.lon - actual.lon) > TOLERANCIA_GRADOS
        || Math.abs(base.lat - actual.lat) > TOLERANCIA_GRADOS
        || Math.abs(base.zoom - actual.zoom) > TOLERANCIA_ZOOM;
};
