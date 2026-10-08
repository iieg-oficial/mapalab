import { describe, it, expect } from 'vitest';
import { latLngToCell } from 'h3-js';
import {
    aggregateToH3,
    clampResolution,
    quantileBreaks,
    classOf,
    H3_MIN_RESOLUTION,
    H3_MAX_RESOLUTION
} from '@pages/maps/helpers/h3Aggregation';

const GDL = [-103.35, 20.67];

describe('clampResolution', () => {
    it('acota al rango soportado', () => {
        expect(clampResolution(0)).toBe(H3_MIN_RESOLUTION);
        expect(clampResolution(99)).toBe(H3_MAX_RESOLUTION);
        expect(clampResolution(7)).toBe(7);
    });

    it('redondea y sobrevive a la basura', () => {
        expect(clampResolution(7.4)).toBe(7);
        expect(clampResolution(undefined)).toBe(H3_MIN_RESOLUTION);
        expect(clampResolution(NaN)).toBe(H3_MIN_RESOLUTION);
    });
});

describe('aggregateToH3', () => {
    it('cuenta en la misma celda los puntos vecinos', () => {
        const counts = aggregateToH3([GDL, [-103.3501, 20.6701], [-103.3502, 20.6699]], 7);
        expect(counts.size).toBe(1);
        expect([...counts.values()][0]).toBe(3);
    });

    it('separa los puntos lejanos', () => {
        const counts = aggregateToH3([GDL, [-104.9, 19.5]], 7);
        expect(counts.size).toBe(2);
    });

    it('usa el índice H3 real como clave', () => {
        const counts = aggregateToH3([GDL], 7);
        expect([...counts.keys()][0]).toBe(latLngToCell(20.67, -103.35, 7));
    });

    it('a mayor resolución, más celdas para los mismos puntos', () => {
        const puntos = [GDL, [-103.36, 20.68], [-103.37, 20.69]];
        expect(aggregateToH3(puntos, 9).size).toBeGreaterThanOrEqual(aggregateToH3(puntos, 5).size);
    });

    it('descarta coordenadas inválidas en vez de romperse', () => {
        const counts = aggregateToH3([GDL, [NaN, 20], [-103.3, 999], ['x', 'y'], null, [-200, 20]], 7);
        expect(counts.size).toBe(1);
    });

    it('devuelve vacío sin puntos', () => {
        expect(aggregateToH3([], 7).size).toBe(0);
        expect(aggregateToH3(null, 7).size).toBe(0);
    });
});

describe('quantileBreaks y classOf', () => {
    it('parte en clases y asigna cada conteo a la suya', () => {
        const valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const breaks = quantileBreaks(valores, 5);
        expect(breaks.length).toBeLessThanOrEqual(4);
        expect(classOf(1, breaks)).toBe(0);
        expect(classOf(10, breaks)).toBe(breaks.length);
    });

    it('no repite cortes cuando los valores se amontonan', () => {
        const breaks = quantileBreaks([5, 5, 5, 5, 5, 5], 5);
        expect(new Set(breaks).size).toBe(breaks.length);
    });

    it('sobrevive a una sola celda', () => {
        const breaks = quantileBreaks([42], 5);
        expect(classOf(42, breaks)).toBeGreaterThanOrEqual(0);
    });

    it('sin valores no hay cortes', () => {
        expect(quantileBreaks([], 5)).toEqual([]);
    });
});
