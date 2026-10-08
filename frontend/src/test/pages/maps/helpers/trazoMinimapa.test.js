import { describe, expect, it } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import { dibujarMinimapa } from '@pages/maps/helpers/trazoMinimapa';

const lienzoFalso = () => {
    const anchos = [];
    const textos = [];
    const rects = [];
    const trazos = [];
    const propios = {
        measureText: texto => ({ width: texto.length * 6 }),
        fillText: (texto, x, y) => textos.push({ texto, x, y }),
        strokeRect: (x, y, w, h) => rects.push([x, y, w, h]),
        stroke: () => trazos.push(propios.strokeStyle),
    };
    const ctx = new Proxy(propios, {
        get: (destino, llave) => (llave in destino ? destino[llave] : () => {}),
        set: (destino, llave, valor) => {
            if (llave === 'lineWidth') anchos.push(valor);
            destino[llave] = valor;
            return true;
        },
    });
    return { ctx, anchos, textos, rects, trazos };
};

const cuadro = new Polygon([[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]]);
const base = { lado: 176, estado: cuadro, municipio: { geometry: cuadro } };

describe('dibujarMinimapa', () => {
    it('de lejos traza el estado a 1.5 y el municipio a 1', () => {
        const { ctx, anchos } = lienzoFalso();
        dibujarMinimapa(ctx, { ...base, vista: { modo: 'estado', centro: [50, 50], resolucion: 1 } });
        expect(anchos).toEqual(expect.arrayContaining([1.5, 1]));
        expect(anchos).not.toContain(3);
    });

    it('de cerca el municipio y el estado van a 2', () => {
        const { ctx, anchos } = lienzoFalso();
        dibujarMinimapa(ctx, { ...base, vista: { modo: 'cerca', centro: [50, 50], resolucion: 1 } });
        expect(anchos.filter(a => a === 2).length).toBeGreaterThanOrEqual(2);
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

    it('el rectángulo de la vista se acota al lienzo aunque la vista se salga', () => {
        const { ctx, rects } = lienzoFalso();
        const vista = { modo: 'cerca', centro: [50, 50], resolucion: 1 };
        dibujarMinimapa(ctx, { ...base, municipio: { geometry: cuadro }, vista, extensionVista: [120, -40, 240, 60] });
        const [x, y, w, h] = rects[0];
        expect(x).toBeGreaterThanOrEqual(1.25);
        expect(y).toBeGreaterThanOrEqual(1.25);
        expect(x + w).toBeLessThanOrEqual(176 - 1.25);
        expect(y + h).toBeLessThanOrEqual(176 - 1.25);
        expect(w).toBeGreaterThan(0);
    });

    it('sin municipio de cerca, o con una vista que cubre todo el cuadro, no hay rectángulo', () => {
        const vista = { modo: 'cerca', centro: [50, 50], resolucion: 1 };
        const sinMunicipio = lienzoFalso();
        dibujarMinimapa(sinMunicipio.ctx, { ...base, municipio: null, vista, extensionVista: [40, 40, 60, 60] });
        expect(sinMunicipio.rects).toHaveLength(0);
        const cubreTodo = lienzoFalso();
        dibujarMinimapa(cubreTodo.ctx, { ...base, vista, extensionVista: [-500, -500, 500, 500] });
        expect(cubreTodo.rects).toHaveLength(0);
    });

    it('en espera solo traza el contorno del estado, sin rectángulo ni nombre', () => {
        const { ctx, anchos, textos, rects } = lienzoFalso();
        const vista = { modo: 'estado', centro: [50, 50], resolucion: 1 };
        dibujarMinimapa(ctx, { ...base, municipio: { nombre: 'Zapopan', geometry: cuadro }, vista, extensionVista: [40, 40, 60, 60], atenuado: true });
        expect(anchos).toEqual([1.5]);
        expect(textos).toHaveLength(0);
        expect(rects).toHaveLength(0);
    });

    it('si la vista abarca todo el municipio, su contorno va en naranja y no hay rectángulo', () => {
        const { ctx, rects, trazos } = lienzoFalso();
        const vista = { modo: 'cerca', centro: [50, 50], resolucion: 1 };
        dibujarMinimapa(ctx, { ...base, vista, extensionVista: [-20, -20, 120, 120] });
        expect(rects).toHaveLength(0);
        expect(trazos).toContain('#FF8300');
    });

    it('si la vista es más chica que el municipio, el contorno sigue morado y hay rectángulo', () => {
        const { ctx, rects, trazos } = lienzoFalso();
        const vista = { modo: 'cerca', centro: [50, 50], resolucion: 1 };
        dibujarMinimapa(ctx, { ...base, vista, extensionVista: [40, 40, 60, 60] });
        expect(rects).toHaveLength(1);
        expect(trazos).not.toContain('#FF8300');
    });
});
