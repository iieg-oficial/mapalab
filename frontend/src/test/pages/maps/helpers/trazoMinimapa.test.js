import { describe, expect, it } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import { dibujarMinimapa } from '@pages/maps/helpers/trazoMinimapa';

const lienzoFalso = () => {
    const anchos = [];
    const textos = [];
    const propios = {
        measureText: texto => ({ width: texto.length * 6 }),
        fillText: (texto, x, y) => textos.push({ texto, x, y }),
    };
    const ctx = new Proxy(propios, {
        get: (destino, llave) => (llave in destino ? destino[llave] : () => {}),
        set: (destino, llave, valor) => {
            if (llave === 'lineWidth') anchos.push(valor);
            destino[llave] = valor;
            return true;
        },
    });
    return { ctx, anchos, textos };
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

    it('de cerca el municipio va al doble y el estado queda de fondo a 1', () => {
        const { ctx, anchos } = lienzoFalso();
        dibujarMinimapa(ctx, { ...base, vista: { modo: 'cerca', centro: [50, 50], resolucion: 1 } });
        expect(anchos).toEqual(expect.arrayContaining([1, 2]));
        expect(anchos).not.toContain(1.5);
        expect(anchos).not.toContain(3);
    });

    it('escribe el nombre del municipio sobre él, dentro del lienzo', () => {
        const { ctx, textos } = lienzoFalso();
        const vista = { modo: 'cerca', centro: [50, 50], resolucion: 1 };
        dibujarMinimapa(ctx, { ...base, municipio: { nombre: 'Zapopan', geometry: cuadro }, vista });
        expect(textos).toHaveLength(1);
        expect(textos[0].texto).toBe('Zapopan');
        expect(textos[0].x).toBeGreaterThan(0);
        expect(textos[0].x).toBeLessThan(176);
    });
});
