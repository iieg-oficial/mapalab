import { getArea, getLength } from 'ol/sphere';
import { LineString, Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';

const RADIO_TIERRA = 6371008.8;
const PASO_METROS = 30;
const MAX_MUESTRAS = 1500;
const CELDAS_AREA = 60;

const aRad = (grados) => (grados * Math.PI) / 180;

export const distanciaMetros = ([lng1, lat1], [lng2, lat2]) => {
    const dLat = aRad(lat2 - lat1);
    const dLng = aRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(aRad(lat1)) * Math.cos(aRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * RADIO_TIERRA * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const largoPlano = (coords) => (coords.length < 2 ? 0 : getLength(new LineString(coords.map(c => fromLonLat(c)))));

export const areaPlana = (coords) => (coords.length < 3
    ? 0
    : getArea(new Polygon([[...coords, coords[0]].map(c => fromLonLat(c))])));

export const perimetro = (coords) => (coords.length < 3 ? 0 : largoPlano([...coords, coords[0]]));

export const densificar = (coords) => {
    if (coords.length < 2) return [];
    const total = largoPlano(coords);
    const paso = Math.max(PASO_METROS, total / MAX_MUESTRAS);
    const muestras = [{ lngLat: coords[0], metros: 0 }];
    let recorrido = 0;
    for (let k = 1; k < coords.length; k++) {
        const a = coords[k - 1];
        const b = coords[k];
        const largo = distanciaMetros(a, b);
        const pasos = Math.max(1, Math.ceil(largo / paso));
        for (let s = 1; s <= pasos; s++) {
            const t = s / pasos;
            muestras.push({ lngLat: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], metros: recorrido + largo * t });
        }
        recorrido += largo;
    }
    return muestras;
};

export const perfilDesde = (muestras, alturas) => {
    const perfil = muestras
        .map((muestra, i) => ({ ...muestra, alt: alturas[i] }))
        .filter(punto => Number.isFinite(punto.alt));
    let superficie = 0;
    let sube = 0;
    let baja = 0;
    for (let i = 1; i < perfil.length; i++) {
        const horizontal = perfil[i].metros - perfil[i - 1].metros;
        const vertical = perfil[i].alt - perfil[i - 1].alt;
        superficie += Math.hypot(horizontal, vertical);
        if (vertical > 0) sube += vertical;
        else baja -= vertical;
    }
    const alts = perfil.map(punto => punto.alt);
    return {
        perfil,
        superficie,
        sube,
        baja,
        max: alts.length ? Math.max(...alts) : null,
        min: alts.length ? Math.min(...alts) : null,
    };
};

const dentro = ([x, y], anillo) => {
    let adentro = false;
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
        const [xi, yi] = anillo[i];
        const [xj, yj] = anillo[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) adentro = !adentro;
    }
    return adentro;
};

export const rejillaSobre = (coords, celdas = CELDAS_AREA) => {
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const [oeste, este, sur, norte] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
    const nodos = [];
    for (let fila = 0; fila <= celdas; fila++) {
        for (let col = 0; col <= celdas; col++) {
            nodos.push([oeste + ((este - oeste) * col) / celdas, sur + ((norte - sur) * fila) / celdas]);
        }
    }
    return { celdas, nodos };
};

export const areaSobreRelieve = (coords, { celdas, nodos }, alturas) => {
    const idx = (fila, col) => fila * (celdas + 1) + col;
    let area = 0;
    for (let fila = 0; fila < celdas; fila++) {
        for (let col = 0; col < celdas; col++) {
            const sw = nodos[idx(fila, col)];
            const se = nodos[idx(fila, col + 1)];
            const nw = nodos[idx(fila + 1, col)];
            const centro = [(sw[0] + se[0]) / 2, (sw[1] + nw[1]) / 2];
            if (!dentro(centro, coords)) continue;
            const ancho = distanciaMetros(sw, se);
            const alto = distanciaMetros(sw, nw);
            const [h, hEste, hNorte] = [alturas[idx(fila, col)], alturas[idx(fila, col + 1)], alturas[idx(fila + 1, col)]];
            const gx = Number.isFinite(h) && Number.isFinite(hEste) && ancho ? (hEste - h) / ancho : 0;
            const gy = Number.isFinite(h) && Number.isFinite(hNorte) && alto ? (hNorte - h) / alto : 0;
            area += ancho * alto * Math.sqrt(1 + gx * gx + gy * gy);
        }
    }
    return Math.max(area, areaPlana(coords));
};
