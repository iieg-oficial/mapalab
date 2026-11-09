import polygonClipping from 'polygon-clipping';

const ALCANCE = 1e7;
const SUMABLES = new Set(['count', 'count_where', 'sum']);

export const esSumable = (slot) => SUMABLES.has(slot?.op);

const areaAnillo = (anillo) => {
    let doble = 0;
    for (let i = 0; i < anillo.length - 1; i++) {
        doble += anillo[i][0] * anillo[i + 1][1] - anillo[i + 1][0] * anillo[i][1];
    }
    return Math.abs(doble) / 2;
};

export const areaMultipoligono = (multipoligono) => multipoligono.reduce(
    (total, poligono) => total + poligono.reduce(
        (suma, anillo, indice) => suma + (indice === 0 ? 1 : -1) * areaAnillo(anillo),
        0,
    ),
    0,
);

const extensionDe = (multipoligono) => {
    const puntos = multipoligono.flat(2);
    const xs = puntos.map(p => p[0]);
    const ys = puntos.map(p => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

export const prepararMunicipios = (siluetas) => (siluetas || []).map(({ clave, nombre, geometry }) => {
    const coords = geometry.getType() === 'Polygon' ? [geometry.getCoordinates()] : geometry.getCoordinates();
    return { clave: String(clave), nombre, geometry, coords, area: areaMultipoligono(coords), extension: extensionDe(coords) };
});

export const crearLinea = (p1, p2, puntoA) => {
    const largo = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    if (!largo) return null;
    const d = [(p2[0] - p1[0]) / largo, (p2[1] - p1[1]) / largo];
    let n = [-d[1], d[0]];
    if ((puntoA[0] - p1[0]) * n[0] + (puntoA[1] - p1[1]) * n[1] < 0) n = [-n[0], -n[1]];
    return { p1, d, n };
};

export const lineaDeBarra = (mapa, posicion, horizontal) => {
    const [ancho, alto] = mapa?.getSize?.() || [];
    if (!ancho || !alto) return null;
    const punto = (x, y) => mapa.getCoordinateFromPixel([x, y]);
    const corte = horizontal ? posicion * alto : posicion * ancho;
    const [p1, p2, a] = horizontal
        ? [punto(0, corte), punto(ancho, corte), punto(ancho / 2, 0)]
        : [punto(corte, 0), punto(corte, alto), punto(0, alto / 2)];
    if (!p1 || !p2 || !a) return null;
    return crearLinea(p1, p2, a);
};

const lado = (linea, [x, y]) => (x - linea.p1[0]) * linea.n[0] + (y - linea.p1[1]) * linea.n[1];

const semiplanoA = ({ p1, d, n }) => {
    const desde = [p1[0] - d[0] * ALCANCE, p1[1] - d[1] * ALCANCE];
    const hasta = [p1[0] + d[0] * ALCANCE, p1[1] + d[1] * ALCANCE];
    const lejos = (p) => [p[0] + n[0] * ALCANCE, p[1] + n[1] * ALCANCE];
    return [[desde, hasta, lejos(hasta), lejos(desde), desde]];
};

export const llavesDe = ({ clave, nombre }) => {
    const corta = clave.slice(-3);
    return [nombre, clave, corta, String(Number(corta))];
};

export const repartir = (municipios, linea) => {
    const region = semiplanoA(linea);
    const asignados = new Map();
    let partidos = 0;
    for (const municipio of municipios) {
        const [x0, y0, x1, y1] = municipio.extension;
        const signos = [[x0, y0], [x0, y1], [x1, y0], [x1, y1]].map(p => lado(linea, p));
        let asignacion;
        if (signos.every(s => s >= 0)) asignacion = { lado: 'A', partido: false };
        else if (signos.every(s => s <= 0)) asignacion = { lado: 'B', partido: false };
        else {
            const enA = areaMultipoligono(polygonClipping.intersection(municipio.coords, region));
            const fraccion = municipio.area ? enA / municipio.area : 0;
            asignacion = { lado: fraccion >= 0.5 ? 'A' : 'B', partido: fraccion > 0.001 && fraccion < 0.999 };
        }
        if (asignacion.partido) partidos++;
        llavesDe(municipio).forEach(llave => asignados.set(llave, asignacion));
    }
    return { asignados, partidos };
};

export const sumarLado = (ranking, reparto, ladoBuscado, permitidos = null) => {
    if (!ranking?.slots?.length || !reparto) return null;
    const valores = ranking.slots.map(slot => (esSumable(slot) ? 0 : null));
    let municipios = 0;
    let cortados = 0;
    for (const { llave, valores: crudos } of ranking.municipios || []) {
        const llaveTexto = String(llave);
        const asignacion = reparto.asignados.get(llaveTexto);
        if (asignacion?.lado !== ladoBuscado) continue;
        if (permitidos && !permitidos.has(llaveTexto)) continue;
        municipios++;
        if (asignacion.partido) cortados++;
        crudos.forEach((valor, indice) => {
            if (valores[indice] !== null && Number.isFinite(Number(valor))) valores[indice] += Number(valor);
        });
    }
    return { valores, municipios, cortados };
};

export const compacto = (valor) => {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
    const absoluto = Math.abs(valor);
    if (absoluto >= 1e6) return `${(valor / 1e6).toFixed(1)}M`;
    if (absoluto >= 1e4) return `${Math.round(valor / 1e3)}K`;
    if (absoluto >= 1e3) return `${(valor / 1e3).toFixed(1)}K`;
    return String(Math.round(valor * 100) / 100);
};
