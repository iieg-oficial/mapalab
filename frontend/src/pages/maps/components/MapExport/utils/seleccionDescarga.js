import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import polygonClipping from 'polygon-clipping';
import { buffer, getHeight, getWidth } from 'ol/extent';
import { transformExtent } from 'ol/proj';

export const MASCARA_Z_INDEX = 2_000_000;

const PROPORCION_MIN = 0.6;
const PROPORCION_MAX = 2.2;

const TIPOS_SELECCION = ['Polygon', 'Select'];
const MARGEN = 0.05;
const MUNDO = [-20037508.34, -20037508.34, 20037508.34, 20037508.34];

export const SELECCION_TODAS = 'todas';

export const seleccionesDisponibles = (measurements = []) => measurements
    .filter(medicion => TIPOS_SELECCION.includes(medicion?.type)
        && medicion.visible !== false
        && medicion.geometry?.getType?.() === 'Polygon')
    .map((medicion, indice) => ({
        id: medicion.id,
        numero: indice + 1,
        geometry: medicion.geometry,
        feature: medicion.feature || null,
    }));

const elegidas = (disponibles, elegida) => {
    if (elegida === SELECCION_TODAS && disponibles.length > 1) return disponibles;
    const una = disponibles.find(disponible => disponible.id === elegida) || disponibles[disponibles.length - 1];
    return una ? [una] : [];
};

export const geometriaDeSeleccion = (disponibles, elegida) => {
    const partes = elegidas(disponibles, elegida);
    if (partes.length === 0) return null;
    if (partes.length === 1) return partes[0].geometry;
    const union = polygonClipping.union(...partes.map(parte => parte.geometry.getCoordinates()));
    return union.length === 1 ? new Polygon(union[0]) : new MultiPolygon(union);
};

export const trazosDeSeleccion = (disponibles, elegida) =>
    elegidas(disponibles, elegida).map(parte => parte.feature).filter(Boolean);

export const extentDeSeleccion = (geometria) => {
    const extent = geometria.getExtent();
    const margen = Math.max(getWidth(extent), getHeight(extent)) * MARGEN;
    return transformExtent(buffer(extent, margen), 'EPSG:3857', 'EPSG:4326');
};

export const anchoParaSeleccion = (geometria, { mapWidth, mapHeight }) => {
    const [minX, minY, maxX, maxY] = geometria.getExtent();
    const alto = maxY - minY;
    if (alto <= 0) return mapWidth;
    const proporcion = Math.min(PROPORCION_MAX, Math.max(PROPORCION_MIN, (maxX - minX) / alto));
    return Math.round(mapHeight * proporcion);
};

export const crearMascara = (geometria) => {
    const [x0, y0, x1, y1] = MUNDO;
    const exterior = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
    const poligonos = geometria.getType() === 'MultiPolygon'
        ? geometria.getCoordinates()
        : [geometria.getCoordinates()];
    const huecos = poligonos.map(poligono => poligono[0]);
    const islas = poligonos.flatMap(poligono => poligono.slice(1).map(anillo => [anillo]));
    if (islas.length === 0) return new Polygon([exterior, ...huecos]);
    return new MultiPolygon([[exterior, ...huecos], ...islas]);
};
