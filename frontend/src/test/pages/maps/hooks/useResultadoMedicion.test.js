import { describe, it, expect } from 'vitest';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { ultimaMedicion, verticesDeMedicion } from '@pages/maps/hooks/useResultadoMedicion';

const linea = [[-103.4, 20.6], [-103.3, 20.7]];
const anillo = [[-103, 20], [-102.9, 20], [-102.9, 20.1], [-103, 20]];
const proyectar = (coords) => coords.map(c => fromLonLat(c));

describe('verticesDeMedicion', () => {
    it('regresa lon/lat de una linea y quita el cierre del poligono', () => {
        const deLinea = verticesDeMedicion({ type: 'LineString', feature: new Feature(new LineString(proyectar(linea))) });
        expect(deLinea[1][0]).toBeCloseTo(-103.3, 6);
        const dePoligono = verticesDeMedicion({ type: 'Polygon', feature: new Feature(new Polygon([proyectar(anillo)])) });
        expect(dePoligono).toHaveLength(3);
        expect(verticesDeMedicion({ type: 'LineString' })).toEqual([]);
    });
});

describe('ultimaMedicion', () => {
    it('toma la ultima linea o poligono visible e ignora anotaciones', () => {
        const lista = [
            { id: 'a', type: 'LineString' },
            { id: 'b', type: 'Polygon', visible: false },
            { id: 'c', type: 'Emoji' },
        ];
        expect(ultimaMedicion(lista).id).toBe('a');
        expect(ultimaMedicion([{ id: 'x', type: 'Text' }])).toBeNull();
    });
});
