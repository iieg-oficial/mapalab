import Polygon from 'ol/geom/Polygon';
import { buffer, getHeight, getWidth } from 'ol/extent';
import { transformExtent } from 'ol/proj';

export const MASCARA_Z_INDEX = 2_000_000;

const TIPOS_SELECCION = ['Polygon', 'Select'];
const MARGEN = 0.05;
const MUNDO = [-20037508.34, -20037508.34, 20037508.34, 20037508.34];

export const ultimaSeleccion = (measurements = []) => {
    for (let i = measurements.length - 1; i >= 0; i -= 1) {
        const medicion = measurements[i];
        if (!TIPOS_SELECCION.includes(medicion?.type) || medicion.visible === false) continue;
        if (medicion.geometry?.getType?.() === 'Polygon') return medicion.geometry;
    }
    return null;
};

export const extentDeSeleccion = (geometria) => {
    const extent = geometria.getExtent();
    const margen = Math.max(getWidth(extent), getHeight(extent)) * MARGEN;
    return transformExtent(buffer(extent, margen), 'EPSG:3857', 'EPSG:4326');
};

export const crearMascara = (geometria) => {
    const [x0, y0, x1, y1] = MUNDO;
    const exterior = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
    return new Polygon([exterior, geometria.getCoordinates()[0]]);
};
