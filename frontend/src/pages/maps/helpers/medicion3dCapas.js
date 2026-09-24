import { DRAW_COLORS, DRAW_FILLS } from './drawingConstants';

export const FUENTE_MEDICION_3D = 'medicion-3d';

const COLOR_POR_MODO = ['match', ['get', 'modo'], 'poligono', DRAW_COLORS.orange, DRAW_COLORS.purpleDeep];

export const capasMedicion3d = [
    { id: `${FUENTE_MEDICION_3D}-relleno`, type: 'fill', source: FUENTE_MEDICION_3D, filter: ['==', ['get', 'rol'], 'area'], paint: { 'fill-color': DRAW_FILLS.orange } },
    { id: `${FUENTE_MEDICION_3D}-linea`, type: 'line', source: FUENTE_MEDICION_3D, filter: ['==', ['get', 'rol'], 'traza'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': COLOR_POR_MODO, 'line-width': 3 } },
    { id: `${FUENTE_MEDICION_3D}-vivo`, type: 'line', source: FUENTE_MEDICION_3D, filter: ['==', ['get', 'rol'], 'vivo'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': COLOR_POR_MODO, 'line-width': 2, 'line-dasharray': [2, 2] } },
    { id: `${FUENTE_MEDICION_3D}-vertices`, type: 'circle', source: FUENTE_MEDICION_3D, filter: ['==', ['get', 'rol'], 'vertice'], paint: { 'circle-radius': 5, 'circle-color': DRAW_COLORS.white, 'circle-stroke-color': COLOR_POR_MODO, 'circle-stroke-width': 2, 'circle-pitch-alignment': 'viewport' } },
    { id: `${FUENTE_MEDICION_3D}-marcador`, type: 'circle', source: FUENTE_MEDICION_3D, filter: ['==', ['get', 'rol'], 'marcador'], paint: { 'circle-radius': 6, 'circle-color': DRAW_COLORS.orange, 'circle-stroke-color': DRAW_COLORS.white, 'circle-stroke-width': 2, 'circle-pitch-alignment': 'viewport' } },
];

const figura = (rol, modo, geometry) => ({ type: 'Feature', properties: { rol, modo }, geometry });

export const geometriaMedicion = ({ modo, vertices, marcador, puntero = null }) => {
    const features = vertices.map(v => figura('vertice', modo, { type: 'Point', coordinates: v }));
    const trazo = puntero && vertices.length ? [...vertices, puntero] : vertices;
    if (modo === 'poligono' && trazo.length > 2) {
        const anillo = [...trazo, trazo[0]];
        features.unshift(figura('area', modo, { type: 'Polygon', coordinates: [anillo] }), figura('traza', modo, { type: 'LineString', coordinates: anillo }));
    } else if (modo !== 'punto' && vertices.length > 1) {
        features.unshift(figura('traza', modo, { type: 'LineString', coordinates: vertices }));
    }
    if (puntero && vertices.length && !(modo === 'poligono' && trazo.length > 2)) {
        features.unshift(figura('vivo', modo, { type: 'LineString', coordinates: [vertices.at(-1), puntero] }));
    }
    if (marcador) features.push(figura('marcador', modo, { type: 'Point', coordinates: marcador }));
    return { type: 'FeatureCollection', features };
};

export const anotacionDeMedicion = (modo, vertices) => {
    if (modo === 'linea' && vertices.length > 1) return { type: 'LineString', visible: true, geometry: { type: 'LineString', coordinates: vertices } };
    if (modo === 'poligono' && vertices.length > 2) return { type: 'Polygon', visible: true, geometry: { type: 'Polygon', coordinates: [[...vertices, vertices[0]]] } };
    return null;
};
