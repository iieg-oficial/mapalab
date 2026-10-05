import { enAlguno, enCaja, localEnRectangulo } from './geometriaEdificio';

const RAD = Math.PI / 180;
export const RADIO = 0.25;
export const OJOS = 1.6;
const PASO_MAX = 0.6;
const VELOCIDAD = { andar: 1.4, correr: 3.4 };
const GIRO_POR_S = 100;
const TOLERANCIA_NIVEL = 0.3;
const MIRADA = [-14, 0];

export const descansoDe = rect => Math.min(1, rect.largo * 0.25);

const acotar = (v, min, max) => Math.min(max, Math.max(min, v));

export const crearCaminante = (x, y, z, rumbo) => ({ x, y, z, rumbo, mirada: -4, paso: 0, moviendo: false });

export const mirar = (c, grados) => ({ ...c, mirada: acotar(c.mirada + grados, MIRADA[0], MIRADA[1]) });

export const alturaEscalera = (escalera, x, y, z) => {
    if (!escalera || !enAlguno(escalera.poligonos, x, y)) return null;
    const { rect, niveles } = escalera;
    const { a, c } = localEnRectangulo(rect, x, y);
    const t = acotar(a / (rect.largo - descansoDe(rect)), 0, 1);
    const tramos = niveles.length - 1;
    const franja = tramos > 1 && c >= rect.ancho / 2 ? 1 : 0;
    let mejor = null;
    for (let k = 0; k < tramos; k += 1) {
        if (tramos > 1 && k % 2 !== franja) continue;
        const s = k % 2 === 0 ? t : 1 - t;
        const h = niveles[k] + (niveles[k + 1] - niveles[k]) * s;
        if (mejor === null || Math.abs(h - z) < Math.abs(mejor - z)) mejor = h;
    }
    return mejor;
};

const altasDesdeArriba = edificio => [...edificio.altas].reverse();

export const sueloEn = (edificio, x, y, z, exterior) => {
    const enEscalera = alturaEscalera(edificio.escalera, x, y, z);
    if (enEscalera !== null) return enEscalera;
    const alta = altasDesdeArriba(edificio).find(a => z >= a.piso.nivel - 1.2 && enAlguno(a.zona, x, y));
    if (alta) return alta.piso.nivel;
    if (enCaja(edificio.caja, x, y)) return edificio.base.nivel;
    return exterior(x, y);
};

export const pisoActual = (edificio, z) => {
    const alta = altasDesdeArriba(edificio).find(a => z >= a.piso.nivel - TOLERANCIA_NIVEL);
    return alta ? alta.piso : edificio.base;
};

export const segmentosActivos = (edificio, z) => {
    const alta = altasDesdeArriba(edificio).find(a => z >= a.piso.nivel - TOLERANCIA_NIVEL);
    return alta ? alta.segmentos : edificio.segmentosBase;
};

const empujar = (x, y, segmentos) => {
    let px = x;
    let py = y;
    for (let vuelta = 0; vuelta < 3; vuelta += 1) {
        segmentos.forEach(([ax, ay, bx, by]) => {
            if (Math.max(ax, bx) < px - RADIO || Math.min(ax, bx) > px + RADIO) return;
            if (Math.max(ay, by) < py - RADIO || Math.min(ay, by) > py + RADIO) return;
            const dx = bx - ax;
            const dy = by - ay;
            const t = acotar(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1e-9), 0, 1);
            const ex = px - (ax + t * dx);
            const ey = py - (ay + t * dy);
            const d = Math.hypot(ex, ey);
            if (d >= RADIO || d < 1e-6) return;
            px += (ex / d) * (RADIO - d);
            py += (ey / d) * (RADIO - d);
        });
    }
    return [px, py];
};

export const pasoCaminante = (c, entrada, edificio, dt, exterior) => {
    const rumbo = (c.rumbo + entrada.giro * GIRO_POR_S * dt + 360) % 360;
    const r = rumbo * RAD;
    const norma = Math.max(1, Math.hypot(entrada.avance, entrada.lateral));
    const v = (VELOCIDAD[entrada.correr ? 'correr' : 'andar'] * dt) / norma;
    const mx = (Math.sin(r) * entrada.avance + Math.cos(r) * entrada.lateral) * v;
    const my = (Math.cos(r) * entrada.avance - Math.sin(r) * entrada.lateral) * v;
    if (!mx && !my) return { ...c, rumbo, moviendo: false };
    const [x, y] = empujar(c.x + mx, c.y + my, segmentosActivos(edificio, c.z));
    const z = sueloEn(edificio, x, y, c.z, exterior);
    if (Math.abs(z - c.z) > PASO_MAX) return { ...c, rumbo, moviendo: false };
    return { ...c, x, y, z, rumbo, moviendo: true, paso: c.paso + Math.hypot(x - c.x, y - c.y) };
};
