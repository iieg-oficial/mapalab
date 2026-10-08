import { describe, it, expect } from 'vitest';
import { buildContorno, outerRings } from '@pages/maps/helpers/limiteEstatal';

const anillo = (desplazamiento) => [[desplazamiento, 0], [desplazamiento + 1, 0], [desplazamiento + 1, 1], [desplazamiento, 0]];

describe('outerRings', () => {
    it('toma el anillo exterior de poligonos y multipoligonos, e ignora los huecos', () => {
        const collection = {
            features: [
                { geometry: { type: 'Polygon', coordinates: [anillo(0), anillo(10)] } },
                { geometry: { type: 'MultiPolygon', coordinates: [[anillo(20)], [anillo(30), anillo(40)]] } },
                { geometry: { type: 'LineString', coordinates: anillo(50) } },
            ],
        };
        const rings = outerRings(collection);
        expect(rings).toHaveLength(3);
        expect(rings.map(r => r[0][0])).toEqual([0, 20, 30]);
    });

    it('aguanta datos vacios', () => {
        expect(outerRings(null)).toEqual([]);
        expect(outerRings({ features: [{}] })).toEqual([]);
    });
});

describe('buildContorno', () => {
    it('arma una sola linea con todos los anillos del estado', () => {
        const contorno = buildContorno({ features: [{ geometry: { type: 'MultiPolygon', coordinates: [[anillo(0)], [anillo(5)]] } }] });
        expect(contorno.features).toHaveLength(1);
        expect(contorno.features[0].geometry.type).toBe('MultiLineString');
        expect(contorno.features[0].geometry.coordinates).toHaveLength(2);
    });

    it('sin geometrias no arma nada', () => {
        expect(buildContorno({ features: [] })).toBeNull();
    });
});
