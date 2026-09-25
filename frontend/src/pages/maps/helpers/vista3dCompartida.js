import { clampExaggeration, clampPitch } from './view3d';
import { ajustesDistintos, normalizarAjustes3d } from './ajustes3d';

const MAX_EXTRUIDAS = 10;

let pendiente = null;
const oyentes = new Set();

const redondear = (valor, decimales) => {
    const factor = 10 ** decimales;
    return Math.round(valor * factor) / factor;
};

const rumbo = (valor) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return 0;
    return redondear(((numero + 180) % 360 + 360) % 360 - 180, 1);
};

export const serializarVista3d = (view3d, slugDe) => {
    if (!view3d?.active) return null;
    const ajustes = ajustesDistintos(view3d.ajustes);
    return {
        pitch: Math.round(clampPitch(view3d.pitch)),
        bearing: rumbo(view3d.bearing),
        exaggeration: redondear(clampExaggeration(view3d.exaggeration), 1),
        extruir: (view3d.extruded || []).map(slugDe).filter(Boolean).slice(0, MAX_EXTRUIDAS),
        ...(Object.keys(ajustes).length ? { ajustes } : {}),
    };
};

export const leerVista3d = (crudo, idDe) => {
    if (!crudo || typeof crudo !== 'object') return null;
    const extruir = Array.isArray(crudo.extruir) ? crudo.extruir : [];
    return {
        pitch: clampPitch(crudo.pitch),
        bearing: rumbo(crudo.bearing),
        exaggeration: clampExaggeration(crudo.exaggeration),
        extruded: extruir.slice(0, MAX_EXTRUIDAS).map(idDe).filter(Boolean),
        ajustes: crudo.ajustes && typeof crudo.ajustes === 'object' ? normalizarAjustes3d(crudo.ajustes) : null,
    };
};

export const pedirVista3d = (vista) => {
    pendiente = vista;
    oyentes.forEach(oyente => oyente());
};

export const tomarVista3d = () => {
    const vista = pendiente;
    pendiente = null;
    return vista;
};

export const suscribirVista3d = (oyente) => {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
};
