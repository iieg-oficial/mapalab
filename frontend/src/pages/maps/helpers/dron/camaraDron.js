import { acotar, amortiguar, desplazar } from './fisicaDron';

const RAD = Math.PI / 180;
export const DISTANCIA_TERCERA = 70;
const ALTURA_MIRA = 4;

export const metaTercera = (dron, { distancia = DISTANCIA_TERCERA, sueloEn, lejania = 1 }) => {
    const r = dron.rumbo * RAD;
    const elevacion = acotar(12.6 - dron.camara * 0.9, 3, 77) * RAD;
    const dist = distancia * lejania;
    const horizontal = dist * Math.cos(elevacion);
    const lngLat = desplazar(dron.lngLat, -Math.sin(r) * horizontal, -Math.cos(r) * horizontal);
    const alt = Math.max(dron.alt + dist * Math.sin(elevacion), sueloEn(lngLat) + 6);
    return { lngLat, alt };
};

export const seguirCamara = (previa, meta, dt) => (previa
    ? {
        lngLat: [amortiguar(previa.lngLat[0], meta.lngLat[0], 6, dt), amortiguar(previa.lngLat[1], meta.lngLat[1], 6, dt)],
        alt: amortiguar(previa.alt, meta.alt, 6, dt),
    }
    : meta);

export const opcionesTercera = (map, camara, dron) => {
    const r = dron.rumbo * RAD;
    const mira = desplazar(dron.lngLat, Math.sin(r) * 10, Math.cos(r) * 10);
    const opciones = map.calculateCameraOptionsFromTo(camara.lngLat, camara.alt, mira, dron.alt + ALTURA_MIRA);
    return { ...opciones, roll: (dron.alabeo / RAD) * 0.25 };
};

export const opcionesPrimera = (map, dron) => map.calculateCameraOptionsFromCameraLngLatAltRotation(
    dron.lngLat,
    dron.alt,
    dron.rumbo,
    acotar(90 + dron.camara + (dron.cabeceo / RAD) * 0.3, 0, 89),
    (dron.alabeo / RAD) * 0.6,
);
