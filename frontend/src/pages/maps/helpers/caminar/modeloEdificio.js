import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { enPoligono, puntoDeRectangulo } from './geometriaEdificio';
import { descansoDe } from './fisicaCaminar';

const LOSA = 0.15;
const MURO_ALTO = 0.2;
const PRETIL = 1.0;
const HUELLA = 0.17;

const COLOR_PISO = {
    oficina: '#EFE6D2',
    trabajo: '#E9DDC2',
    sala: '#E4D6EA',
    recepcion: '#D9E7F1',
    comedor: '#F2DCCB',
    circulacion: '#ECEAE4',
    servicio: '#DEDEDE',
    exterior: '#CFDDBF',
};

const MATERIALES = {
    muro: new THREE.MeshLambertMaterial({ color: '#F1EEE8' }),
    losa: new THREE.MeshLambertMaterial({ color: '#D8D2C6', side: THREE.DoubleSide }),
    escalera: new THREE.MeshLambertMaterial({ color: '#C9B48A' }),
    pretil: new THREE.MeshLambertMaterial({ color: '#B9B3A8' }),
    suelo: new THREE.MeshLambertMaterial({ color: '#E2DED6', side: THREE.DoubleSide }),
};

const forma = (poligono) => {
    const [exterior, ...huecos] = poligono;
    const f = new THREE.Shape(exterior.map(([x, y]) => new THREE.Vector2(x, y)));
    huecos.forEach(h => f.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
    return f;
};

const extruir = (poligono, z0, alto, huecosExtra = []) => {
    const f = forma(poligono);
    huecosExtra.forEach(h => f.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
    const g = new THREE.ExtrudeGeometry(f, { depth: alto, bevelEnabled: false });
    g.translate(0, 0, z0);
    return g;
};

const plano = (poligono, z) => {
    const g = new THREE.ShapeGeometry(forma(poligono));
    g.translate(0, 0, z);
    return g;
};

const caja = (largo, ancho, alto, x, y, z, angulo) => {
    const g = new THREE.BoxGeometry(largo, ancho, alto);
    g.rotateZ(angulo);
    g.translate(x, y, z + alto / 2);
    return g;
};

const bordes = (anillo, z0, alto, grueso) => anillo.map((a, i) => {
    const b = anillo[(i + 1) % anillo.length];
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return largo < 0.05 ? null : caja(largo, grueso, alto, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z0, Math.atan2(b[1] - a[1], b[0] - a[0]));
}).filter(Boolean);

const malla = (geometrias, material) => {
    const validas = geometrias.filter(Boolean).map(g => (g.index ? g.toNonIndexed() : g));
    if (!validas.length) return null;
    validas.forEach(g => Object.keys(g.attributes).forEach((n) => { if (!['position', 'normal'].includes(n)) g.deleteAttribute(n); }));
    const unida = mergeGeometries(validas);
    validas.forEach(g => g.dispose());
    return unida ? new THREE.Mesh(unida, material) : null;
};

const peldanos = (escalera) => {
    const { rect, niveles } = escalera;
    const tramos = niveles.length - 1;
    const anchoTramo = (tramos > 1 ? rect.ancho / 2 : rect.ancho) - 0.04;
    const angulo = Math.atan2(rect.eje[1], rect.eje[0]);
    const descanso = descansoDe(rect);
    const recorrido = rect.largo - descanso;
    const [dx, dy] = puntoDeRectangulo(rect, recorrido + descanso / 2, rect.ancho / 2);
    const losaDescanso = caja(descanso, rect.ancho - 0.04, LOSA, dx, dy, niveles[1] - LOSA, angulo);
    return [losaDescanso, ...Array.from({ length: tramos }, (_, k) => {
        const franja = tramos > 1 ? k % 2 : 0;
        const c = (tramos > 1 ? rect.ancho / 4 + franja * (rect.ancho / 2) : rect.ancho / 2);
        const sube = niveles[k + 1] - niveles[k];
        const n = Math.max(2, Math.round(sube / HUELLA));
        const fondo = recorrido / n;
        return Array.from({ length: n }, (__, i) => {
            const t = (i + 0.5) / n;
            const a = (k % 2 === 0 ? t : 1 - t) * recorrido;
            const [x, y] = puntoDeRectangulo(rect, a, c);
            const tope = niveles[k] + (sube * (i + 1)) / n;
            return caja(fondo, anchoTramo, tope - niveles[0], x, y, niveles[0], angulo);
        });
    }).flat()];
};

const techoBase = (edificio, escalera) => {
    const { base, huella } = edificio;
    const z = base.nivel + base.altura - LOSA;
    const hueco = escalera?.poligonos[0]?.[0];
    return huella.map((p) => {
        const conHueco = hueco && enPoligono(p, hueco[0][0], hueco[0][1]);
        return extruir(p, z, LOSA, conHueco ? [hueco] : []);
    });
};

const losasAltas = (edificio, huecos) => edificio.altas.flatMap(a => a.zona.map(p => extruir(p, a.piso.nivel - LOSA - 0.01, LOSA + 0.02, huecos)));

const murosAltos = edificio => edificio.altas.flatMap(a => a.zona.flatMap(p => (a.piso.altura > 0
    ? bordes(p[0], a.piso.nivel, a.piso.altura, MURO_ALTO)
    : bordes(p[0], a.piso.nivel, PRETIL, MURO_ALTO / 2))));

export const construirEdificio = (edificio) => {
    const grupo = new THREE.Group();
    const huecoEscalera = edificio.escalera ? edificio.escalera.poligonos : null;
    const huecos = huecoEscalera ? huecoEscalera.map(p => p[0]) : [];
    const muros = edificio.muros.flatMap(m => m.poligonos.map(p => extruir(p, m.piso.nivel + m.base, m.altura ?? m.piso.altura)));
    const pisos = Object.entries(COLOR_PISO).map(([tipo, color]) => malla(
        edificio.espacios.filter(e => e.tipo === tipo).flatMap(e => e.poligonos.map(p => plano([p[0]], edificio.base.nivel + 0.02))),
        new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }),
    ));
    [
        malla(muros, MATERIALES.muro),
        malla([...techoBase(edificio, edificio.escalera), ...losasAltas(edificio, huecos)], MATERIALES.losa),
        malla(edificio.huella.map(p => plano(p, edificio.base.nivel + 0.005)), MATERIALES.suelo),
        malla(murosAltos(edificio).filter(Boolean), MATERIALES.pretil),
        edificio.escalera ? malla(peldanos(edificio.escalera), MATERIALES.escalera) : null,
        ...pisos,
    ].filter(Boolean).forEach(m => grupo.add(m));
    return grupo;
};

export const liberarGrupo = (grupo) => {
    grupo.traverse((o) => {
        o.geometry?.dispose();
        if (o.material && !Object.values(MATERIALES).includes(o.material)) o.material.dispose();
    });
};
