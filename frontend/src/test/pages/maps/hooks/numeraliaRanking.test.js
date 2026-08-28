import { describe, it, expect } from 'vitest';
import { ordenarRanking, admiteProporcion } from '@hooksMaps/useNumeraliaRanking';

const ranking = {
    campo: 'municipio',
    tipo: 'nombre',
    slots: [
        { posicion: 1, nombre: 'Total', op: 'count' },
        { posicion: 2, nombre: 'Privadas', op: 'count_where' },
        { posicion: 3, nombre: 'Promedio de aulas', op: 'avg' },
    ],
    municipios: [
        { llave: 'Guadalajara', valores: [1000, 300, 12] },
        { llave: 'Zapopan', valores: [500, 200, 9] },
        { llave: 'Etzatlán', valores: [50, 5, 4] },
    ],
};

describe('admiteProporcion', () => {
    it('acepta un conteo contra el total', () => {
        expect(admiteProporcion(ranking, 1)).toBe(true);
    });

    it('rechaza el slot base y los promedios', () => {
        expect(admiteProporcion(ranking, 0)).toBe(false);
        expect(admiteProporcion(ranking, 2)).toBe(false);
    });
});

describe('ordenarRanking', () => {
    it('ordena por absoluto de mayor a menor y numera', () => {
        const filas = ordenarRanking(ranking, 1, false);
        expect(filas.map(f => f.llave)).toEqual(['Guadalajara', 'Zapopan', 'Etzatlán']);
        expect(filas.map(f => f.posicion)).toEqual([1, 2, 3]);
    });

    it('cambia el orden al pedir porcentaje', () => {
        const filas = ordenarRanking(ranking, 1, true);
        expect(filas.map(f => f.llave)).toEqual(['Zapopan', 'Guadalajara', 'Etzatlán']);
        expect(filas[0].porcentaje).toBeCloseTo(40);
        expect(filas[0].bruto).toBe(200);
    });

    it('ignora el porcentaje en slots que no lo admiten', () => {
        const filas = ordenarRanking(ranking, 2, true);
        expect(filas.map(f => f.llave)).toEqual(['Guadalajara', 'Zapopan', 'Etzatlán']);
        expect(filas[0].porcentaje).toBeNull();
    });

    it('descarta municipios sin dato en el slot elegido', () => {
        const conHuecos = {
            ...ranking,
            municipios: [
                { llave: 'Guadalajara', valores: [1000, 300, 12] },
                { llave: 'Ameca', valores: [40, null, 3] },
            ],
        };
        const filas = ordenarRanking(conHuecos, 1, false);
        expect(filas.map(f => f.llave)).toEqual(['Guadalajara']);
    });

    it('no divide entre cero al pedir porcentaje', () => {
        const conCero = {
            ...ranking,
            municipios: [
                { llave: 'Guadalajara', valores: [1000, 300, 12] },
                { llave: 'Vacío', valores: [0, 0, 0] },
            ],
        };
        const filas = ordenarRanking(conCero, 1, true);
        expect(filas.map(f => f.llave)).toEqual(['Guadalajara']);
    });

    it('devuelve vacío sin datos', () => {
        expect(ordenarRanking(null, 0, false)).toEqual([]);
        expect(ordenarRanking({ slots: [], municipios: [] }, 0, false)).toEqual([]);
    });
});
