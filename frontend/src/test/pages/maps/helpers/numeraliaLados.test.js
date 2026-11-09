import { describe, it, expect } from 'vitest';
import { conFechas, filasDeLados, ladoDe } from '@pages/maps/helpers/numeraliaLados';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';

const swipe = (a, b, activeSlot = 'A') => ({
    active: true,
    activeSlot,
    paneA: { activeLayerIds: a },
    paneB: { activeLayerIds: b },
});

describe('conFechas', () => {
    it('agrega el rango del filtro de fecha al contexto', () => {
        expect(conFechas({ claves: ['039'] }, generateCQLFilter(new Set(['2020'])))).toEqual({
            claves: ['039'],
            fechaInicio: '2020-01-01',
            fechaFin: '2020-12-31',
        });
    });

    it('sin filtro devuelve el mismo contexto', () => {
        const base = { claves: ['039'] };
        expect(conFechas(base, null)).toBe(base);
        expect(conFechas(null, null)).toBeNull();
    });
});

describe('ladoDe', () => {
    it('fuera del comparador no hay lado', () => {
        expect(ladoDe({ active: false }, 'capa')).toEqual({ lado: null, ambos: false });
    });

    it('una capa de un solo lado se queda en ese lado', () => {
        expect(ladoDe(swipe([], ['capa'], 'A'), 'capa')).toEqual({ lado: 'B', ambos: false });
    });

    it('una capa en los dos lados sigue al lado activo', () => {
        expect(ladoDe(swipe(['capa'], ['capa'], 'B'), 'capa')).toEqual({ lado: 'B', ambos: true });
        expect(ladoDe(swipe(['capa'], ['capa'], 'A'), 'capa')).toEqual({ lado: 'A', ambos: true });
    });
});

describe('filasDeLados', () => {
    it('alinea por nombre y calcula la diferencia de B contra A', () => {
        const filas = filasDeLados(
            [{ nombre: 'Población', valor: '8507662' }, { nombre: 'Promedio', valor: '68061.30' }],
            [{ nombre: 'Promedio', valor: '71226.61' }, { nombre: 'Población', valor: '8903326' }],
        );
        expect(filas[0]).toMatchObject({ nombre: 'Población', a: '8507662', b: '8903326', delta: 395664 });
        expect(filas[0].cambio).toBeCloseTo(4.65, 2);
        expect(filas[1].delta).toBeCloseTo(3165.31, 2);
    });

    it('sin el dato de un lado no hay diferencia', () => {
        const [fila] = filasDeLados([{ nombre: 'Población', valor: '10' }], []);
        expect(fila).toMatchObject({ b: null, delta: null, cambio: null });
    });
});
