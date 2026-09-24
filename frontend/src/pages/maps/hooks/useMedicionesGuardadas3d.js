import { useEffect } from 'react';
import { DRAW_COLORS, DRAW_FILLS } from '@pages/maps/helpers/drawingConstants';
import { anotacionDeMedicion } from '@pages/maps/helpers/medicion3dCapas';
import { verticesDeMedicion } from './useResultadoMedicion';

const FUENTE = 'mediciones-guardadas';
const MODOS = { LineString: 'linea', Polygon: 'poligono' };

const capas = [
    { id: `${FUENTE}-relleno`, type: 'fill', source: FUENTE, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': DRAW_FILLS.orange } },
    {
        id: `${FUENTE}-linea`,
        type: 'line',
        source: FUENTE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ['match', ['geometry-type'], 'Polygon', DRAW_COLORS.orange, DRAW_COLORS.purpleDeep], 'line-width': 3 },
    },
];

export const coleccionGuardadas = (measurements) => ({
    type: 'FeatureCollection',
    features: measurements
        .filter(m => MODOS[m.type] && m.visible !== false)
        .map(m => anotacionDeMedicion(MODOS[m.type], verticesDeMedicion(m)))
        .filter(Boolean)
        .map(({ geometry }) => ({ type: 'Feature', properties: {}, geometry })),
});

export const useMedicionesGuardadas3d = (map, measurements) => {
    useEffect(() => {
        if (!map) return undefined;
        map.addSource(FUENTE, { type: 'geojson', data: coleccionGuardadas([]) });
        capas.forEach(capa => map.addLayer(capa));
        return () => {
            capas.forEach(capa => { if (map.getLayer(capa.id)) map.removeLayer(capa.id); });
            if (map.getSource(FUENTE)) map.removeSource(FUENTE);
        };
    }, [map]);

    useEffect(() => {
        map?.getSource(FUENTE)?.setData(coleccionGuardadas(measurements || []));
    }, [map, measurements]);
};
