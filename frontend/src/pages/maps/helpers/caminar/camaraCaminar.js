import { desplazar } from '@pages/maps/helpers/dron/fisicaDron';
import { corteRayo, enCaja } from './geometriaEdificio';
import { OJOS, pisoActual, segmentosActivos } from './fisicaCaminar';

const RAD = Math.PI / 180;
const MIRA = 12;
const DETRAS = 2.8;
const SOBRE_CABEZA = 0.6;
const HOLGURA = 0.3;
const DETRAS_MIN = 0.5;

const distanciaLibre = (segmentos, c, dx, dy) => {
    const t = segmentos.reduce((min, s) => Math.min(min, corteRayo(c.x, c.y, dx * DETRAS, dy * DETRAS, s)), Infinity);
    return t === Infinity ? DETRAS : Math.max(DETRAS_MIN, t * DETRAS - HOLGURA);
};

export const camaraPrimera = (map, origen, c, base) => {
    const ojo = desplazar(origen, c.x, c.y);
    const r = c.rumbo * RAD;
    const mira = desplazar(ojo, Math.sin(r) * MIRA, Math.cos(r) * MIRA);
    return map.calculateCameraOptionsFromTo(ojo, base + c.z + OJOS, mira, base + c.z + OJOS + Math.tan(c.mirada * RAD) * MIRA);
};

export const camaraTercera = (map, edificio, c, base) => {
    const r = c.rumbo * RAD;
    const piso = pisoActual(edificio, c.z);
    const dentro = enCaja(edificio.caja, c.x, c.y) && piso.altura > 0;
    const techo = dentro ? piso.nivel + piso.altura - 0.25 : Infinity;
    const alto = Math.min(c.z + OJOS + SOBRE_CABEZA, techo);
    const atras = distanciaLibre(segmentosActivos(edificio, c.z), c, -Math.sin(r), -Math.cos(r));
    const cam = desplazar(edificio.origen, c.x - Math.sin(r) * atras, c.y - Math.cos(r) * atras);
    const mira = desplazar(edificio.origen, c.x + Math.sin(r) * 2, c.y + Math.cos(r) * 2);
    return map.calculateCameraOptionsFromTo(cam, base + alto, mira, base + c.z + 1.2 + Math.tan(c.mirada * RAD) * 2);
};
