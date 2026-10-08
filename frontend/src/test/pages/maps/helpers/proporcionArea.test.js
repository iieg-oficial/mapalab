import { describe, it, expect } from 'vitest';
import { areaMultipoligono, fraccionDentro, sumaPorFraccion } from '@pages/maps/helpers/proporcionArea';

const cuadro = (x0, y0, lado) => [[[x0, y0], [x0 + lado, y0], [x0 + lado, y0 + lado], [x0, y0 + lado], [x0, y0]]];
const seleccion = cuadro(0, 0, 10);

describe('proporcionArea', () => {
    it('mide el área restando los huecos', () => {
        expect(areaMultipoligono([cuadro(0, 0, 10)])).toBe(100);
        expect(areaMultipoligono([[...cuadro(0, 0, 10), cuadro(2, 2, 2)[0]]])).toBe(96);
    });

    it('calcula qué fracción de cada polígono cae dentro de la selección', () => {
        expect(fraccionDentro({ type: 'Polygon', coordinates: cuadro(2, 2, 4) }, seleccion)).toBe(1);
        expect(fraccionDentro({ type: 'Polygon', coordinates: cuadro(5, 0, 10) }, seleccion)).toBeCloseTo(0.5);
        expect(fraccionDentro({ type: 'Polygon', coordinates: cuadro(20, 20, 5) }, seleccion)).toBe(0);
        expect(fraccionDentro({ type: 'MultiPolygon', coordinates: [cuadro(0, 0, 5), cuadro(30, 30, 5)] }, seleccion)).toBeCloseTo(0.5);
    });

    it('reparte cada valor según la parte de su polígono que queda dentro', () => {
        const features = [
            { geometry: { type: 'Polygon', coordinates: cuadro(2, 2, 4) }, properties: { poblacion: 1000 } },
            { geometry: { type: 'Polygon', coordinates: cuadro(5, 0, 10) }, properties: { poblacion: 400 } },
            { geometry: { type: 'Polygon', coordinates: cuadro(50, 50, 5) }, properties: { poblacion: 9999 } },
            { geometry: { type: 'Polygon', coordinates: cuadro(1, 1, 1) }, properties: { poblacion: null } },
        ];
        const { suma, elementos } = sumaPorFraccion(features, 'poblacion', seleccion);
        expect(suma).toBeCloseTo(1200);
        expect(elementos).toBe(2);
    });
});
