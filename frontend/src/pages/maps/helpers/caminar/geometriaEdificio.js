const MARGEN_HUELLA = 2;

const sinCierre = anillo => (anillo.length > 1 && anillo[0][0] === anillo.at(-1)[0] && anillo[0][1] === anillo.at(-1)[1]
    ? anillo.slice(0, -1)
    : anillo);

const areaAnillo = anillo => anillo.reduce((s, [x, y], i) => {
    const [x2, y2] = anillo[(i + 1) % anillo.length];
    return s + x * y2 - x2 * y;
}, 0) / 2;

const limpiar = anillo => sinCierre(anillo).filter((q, i, a) => i === 0 || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);

export const anillosDe = (poligono) => {
    const anillos = poligono.map(limpiar);
    return Math.abs(areaAnillo(anillos[0])) < 0.0001 ? [] : [anillos[0], ...anillos.slice(1).filter(a => a.length >= 3 && Math.abs(areaAnillo(a)) >= 0.0001)];
};

export const contieneAnillo = (anillo, x, y) => {
    let dentro = false;
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
        const [xi, yi] = anillo[i];
        const [xj, yj] = anillo[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
};

export const enPoligono = (poligono, x, y) => contieneAnillo(poligono[0], x, y)
    && !poligono.slice(1).some(hueco => contieneAnillo(hueco, x, y));

export const enAlguno = (poligonos, x, y) => poligonos.some(p => enPoligono(p, x, y));

const segmentosDe = (poligonos, soloExterior = false) => poligonos.flatMap(p => (soloExterior ? [p[0]] : p).flatMap(anillo => (
    anillo.map((a, i) => {
        const b = anillo[(i + 1) % anillo.length];
        return [a[0], a[1], b[0], b[1]];
    })
)));

const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

const envolvente = (puntos) => {
    const p = [...puntos].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const mitad = (lista) => {
        const h = [];
        lista.forEach((q) => {
            while (h.length >= 2 && cruz(h.at(-2), h.at(-1), q) <= 0) h.pop();
            h.push(q);
        });
        return h.slice(0, -1);
    };
    return [...mitad(p), ...mitad([...p].reverse())];
};

export const rectanguloMinimo = (puntos) => {
    const h = envolvente(puntos);
    let mejor = null;
    h.forEach((a, i) => {
        const b = h[(i + 1) % h.length];
        const largoBorde = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const u = [(b[0] - a[0]) / largoBorde, (b[1] - a[1]) / largoBorde];
        const v = [-u[1], u[0]];
        const pu = h.map(q => q[0] * u[0] + q[1] * u[1]);
        const pv = h.map(q => q[0] * v[0] + q[1] * v[1]);
        const [u0, u1, v0, v1] = [Math.min(...pu), Math.max(...pu), Math.min(...pv), Math.max(...pv)];
        const area = (u1 - u0) * (v1 - v0);
        if (!mejor || area < mejor.area) mejor = { area, u, v, u0, u1, v0, v1 };
    });
    const { u, v, u0, u1, v0, v1 } = mejor;
    const largoU = u1 - u0 >= v1 - v0;
    const eje = largoU ? u : v;
    const cruzado = largoU ? v : u;
    const [e0, e1, c0, c1] = largoU ? [u0, u1, v0, v1] : [v0, v1, u0, u1];
    return { eje, cruzado, e0, largo: e1 - e0, c0, ancho: c1 - c0 };
};

export const localEnRectangulo = (r, x, y) => ({
    a: x * r.eje[0] + y * r.eje[1] - r.e0,
    c: x * r.cruzado[0] + y * r.cruzado[1] - r.c0,
});

export const puntoDeRectangulo = (r, a, c) => {
    const pa = r.e0 + a;
    const pc = r.c0 + c;
    return [r.eje[0] * pa + r.cruzado[0] * pc, r.eje[1] * pa + r.cruzado[1] * pc];
};

const prepararEscalera = (elemento, pisos) => {
    if (!elemento) return null;
    const desde = pisos.findIndex(p => p.id === elemento.pisoId);
    const niveles = pisos.slice(Math.max(0, desde)).filter(p => p.transitable).map(p => p.nivel);
    if (niveles.length < 2) return null;
    const poligonos = elemento.poligonos.map(anillosDe).filter(p => p.length);
    return { poligonos, rect: rectanguloMinimo(poligonos.flatMap(p => p[0])), niveles };
};

const cajaDe = (poligonos) => {
    const puntos = poligonos.flatMap(p => p[0]);
    const xs = puntos.map(q => q[0]);
    const ys = puntos.map(q => q[1]);
    return [Math.min(...xs) - MARGEN_HUELLA, Math.min(...ys) - MARGEN_HUELLA, Math.max(...xs) + MARGEN_HUELLA, Math.max(...ys) + MARGEN_HUELLA];
};

const zonasAltas = (pisos, volumenes) => pisos.slice(1).map((piso, i) => {
    const propios = volumenes.filter(e => e.pisoId === piso.id);
    const deAbajo = volumenes.filter(e => e.pisoId === pisos[i].id);
    const zona = (propios.length ? propios : (piso.altura === 0 ? deAbajo : [])).flatMap(e => e.poligonos);
    return { piso, zona, segmentos: segmentosDe(zona, true) };
}).filter(z => z.zona.length && z.piso.transitable);

export const prepararEdificio = (datos) => {
    const pisos = [...datos.pisos].sort((a, b) => a.nivel - b.nivel || a.orden - b.orden);
    const base = pisos[0];
    const porId = new Map(pisos.map(p => [p.id, p]));
    const elementos = datos.elementos.map(e => ({ ...e, poligonos: e.poligonos.map(anillosDe).filter(p => p.length), piso: porId.get(e.pisoId) })).filter(e => e.piso);
    const muros = elementos.filter(e => e.tipo === 'muro');
    const volumenes = elementos.filter(e => e.tipo === 'volumen');
    const espacios = datos.espacios.map(e => ({ ...e, poligonos: e.poligonos.map(anillosDe).filter(p => p.length) })).filter(e => e.pisoId === base.id);
    const altas = zonasAltas(pisos, volumenes);
    return {
        origen: [datos.origen.lng, datos.origen.lat],
        pisos,
        base,
        muros,
        volumenes,
        espacios,
        altas,
        huella: (datos.huella || []).map(anillosDe).filter(p => p.length),
        escalera: prepararEscalera(elementos.find(e => e.tipo === 'escalera'), pisos),
        segmentosBase: segmentosDe(muros.filter(m => m.piso.id === base.id).flatMap(m => m.poligonos)),
        caja: cajaDe(datos.espacios.map(e => e.poligonos.map(anillosDe)).flat()),
    };
};

export const enCaja = ([x0, y0, x1, y1], x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

export const espacioEn = (edificio, x, y) => edificio.espacios.find(e => enAlguno(e.poligonos, x, y)) || null;

export const corteRayo = (px, py, dx, dy, [ax, ay, bx, by]) => {
    const ex = bx - ax;
    const ey = by - ay;
    const d = dx * ey - dy * ex;
    if (Math.abs(d) < 1e-9) return Infinity;
    const t = ((ax - px) * ey - (ay - py) * ex) / d;
    const u = ((ax - px) * dy - (ay - py) * dx) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : Infinity;
};
