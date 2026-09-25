export const ZOOM_MINIMAPA = 10;
const TESELA = 256;

export const aMundo = ([lng, lat], zoom) => {
    const n = TESELA * 2 ** zoom;
    const s = Math.sin((lat * Math.PI) / 180);
    return [((lng + 180) / 360) * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
};

export const aLngLat = ([x, y], zoom) => {
    const n = TESELA * 2 ** zoom;
    const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
    return [(x / n) * 360 - 180, lat];
};

export const urlTesela = (plantilla, z, x, y) => plantilla
    .replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{s}', 'a');

export const teselasVisibles = (centro, ancho, alto, zoom) => {
    const [cx, cy] = aMundo(centro, zoom);
    const [x0, y0] = [cx - ancho / 2, cy - alto / 2];
    const lista = [];
    for (let tx = Math.floor(x0 / TESELA); tx <= Math.floor((x0 + ancho) / TESELA); tx += 1) {
        for (let ty = Math.floor(y0 / TESELA); ty <= Math.floor((y0 + alto) / TESELA); ty += 1) {
            lista.push({ tx, ty, x: tx * TESELA - x0, y: ty * TESELA - y0 });
        }
    }
    return lista;
};

export const deMinimapa = (centro, [px, py], ancho, alto, zoom) => {
    const [cx, cy] = aMundo(centro, zoom);
    return aLngLat([cx - ancho / 2 + px, cy - alto / 2 + py], zoom);
};

export const aMinimapa = (centro, punto, ancho, alto, zoom) => {
    const [cx, cy] = aMundo(centro, zoom);
    const [x, y] = aMundo(punto, zoom);
    return [x - cx + ancho / 2, y - cy + alto / 2];
};
