import { describe, expect, it } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import { dibujarMinimapa } from '@pages/maps/helpers/trazoMinimapa';

const lienzoFalso = () => {
    const anchos = [];
    const ctx = new Proxy({}, {
        get: (destino, llave) => (llave in destino ? destino[llave] : () => {}),
        set: (destino, llave, valor) => {
            if (llave === 'lineWidth') anchos.push(valor);
            destino[llave] = valor;
            return true;
        },
    });
    return { ctx, anchos };
};

const cuadro = new Polygon([[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]);
const base = { lado: 176, estado: cuadro, municipio: { geometry: cuadro }, sinFondo: true };

describe('dibujarMinimapa', () => {
    it('de lejos traza el estado a 1.5 y el municipio a 1', () => {
        const { ctx, anchos } = lienzoFalso();
        dibujarMinimapa(ctx, { ...base, vista: { modo: 'estado', centro: [50, 50], resolucion: 1 } });
        expect(anchos).toEqual(expect.arrayContaining([1.5, 1]));
        expect(anchos).not.toContain(3);
    });

    it('de cerca duplica los dos bordes para que no se pierdan', () => {
        const { ctx, anchos } = lienzoFalso();
        dibujarMinimapa(ctx, { ...base, vista: { modo: 'cerca', centro: [50, 50], resolucion: 1 } });
        expect(anchos).toEqual(expect.arrayContaining([3, 2]));
        expect(anchos).not.toContain(1.5);
    });
});
