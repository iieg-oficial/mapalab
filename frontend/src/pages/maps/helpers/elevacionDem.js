import { terrainSourceSpec } from './view3d';

const ZOOM = 12;
const TILE = 256;
const cache = new Map();

export const pixelDe = ([lng, lat], zoom = ZOOM) => {
    const n = 2 ** zoom;
    const x = ((lng + 180) / 360) * n;
    const rad = (lat * Math.PI) / 180;
    const y = ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    return {
        tx,
        ty,
        px: Math.min(TILE - 1, Math.floor((x - tx) * TILE)),
        py: Math.min(TILE - 1, Math.floor((y - ty) * TILE)),
    };
};

export const alturaDesdeRgba = (datos, px, py) => {
    const i = (py * TILE + px) * 4;
    if (datos[i + 3] < 250) return null;
    return datos[i] * 256 + datos[i + 1];
};

const urlDe = (tx, ty) => terrainSourceSpec().tiles[0]
    .replace('{z}', String(ZOOM))
    .replace('{x}', String(tx))
    .replace('{y}', String(ty));

const cargarTile = (tx, ty) => {
    const clave = `${tx}/${ty}`;
    if (!cache.has(clave)) {
        cache.set(clave, fetch(urlDe(tx, ty))
            .then(respuesta => (respuesta.ok ? respuesta.blob() : null))
            .then(blob => (blob ? createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }) : null))
            .then((imagen) => {
                if (!imagen) return null;
                const lienzo = document.createElement('canvas');
                lienzo.width = TILE;
                lienzo.height = TILE;
                const ctx = lienzo.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(imagen, 0, 0);
                return ctx.getImageData(0, 0, TILE, TILE).data;
            })
            .catch(() => null));
    }
    return cache.get(clave);
};

export const alturas = (puntos) => Promise.all(puntos.map(async (punto) => {
    const { tx, ty, px, py } = pixelDe(punto);
    const datos = await cargarTile(tx, ty);
    return datos ? alturaDesdeRgba(datos, px, py) : null;
}));
