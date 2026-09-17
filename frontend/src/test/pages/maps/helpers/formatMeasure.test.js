import { describe, it, expect } from 'vitest';
import { formatLengthValue, formatAreaValue, getSegmentLengths } from '@pages/maps/helpers/formatMeasure';

const MILES = ',';

describe('formatLengthValue', () => {
    it('auto: usa m para valores <= 1000', () => {
        const result = formatLengthValue(500, 'auto');
        expect(result).toMatch(new RegExp(`500[\\s${MILES}]?m`));
    });

    it('auto: usa km para valores > 1000', () => {
        const result = formatLengthValue(1500, 'auto');
        expect(result).toContain('km');
        expect(result).not.toContain('m²');
    });

    it('m: siempre muestra metros', () => {
        const result = formatLengthValue(5000, 'm');
        expect(result).toContain('m');
        expect(result).not.toContain('km');
    });

    it('km: siempre muestra kilometros', () => {
        const result = formatLengthValue(500, 'km');
        expect(result).toContain('km');
    });

    it('redondea a 2 decimales', () => {
        const result = formatLengthValue(1234.567, 'm');
        expect(result).toBe(`1${MILES}234.57 m`);
    });
});

describe('formatAreaValue', () => {
    it('auto: usa m² para valores <= 10000', () => {
        const result = formatAreaValue(5000, 'auto');
        expect(result).toContain('m²');
    });

    it('auto: usa km² para valores > 10000', () => {
        const result = formatAreaValue(50000, 'auto');
        expect(result).toContain('km²');
    });

    it('m2: siempre muestra m²', () => {
        const result = formatAreaValue(500000, 'm2');
        expect(result).toContain('m²');
    });

    it('ha: muestra hectareas', () => {
        const result = formatAreaValue(50000, 'ha');
        expect(result).toBe('5 ha');
    });

    it('km2: muestra km²', () => {
        const result = formatAreaValue(5000000, 'km2');
        expect(result).toBe('5 km²');
    });

    it('redondea a 2 decimales', () => {
        const result = formatAreaValue(12345.678, 'm2');
        expect(result).toBe(`12${MILES}345.68 m²`);
    });
});

describe('getSegmentLengths', () => {
    it('retorna array vacio para un solo punto', () => {
        const coords = [[0, 0]];
        expect(getSegmentLengths(coords)).toEqual([]);
    });

    it('retorna un segmento para dos puntos', () => {
        const coords = [[0, 0], [0, 0.001]];
        const lengths = getSegmentLengths(coords);
        expect(lengths).toHaveLength(1);
        expect(lengths[0]).toBeGreaterThan(0);
    });

    it('retorna n-1 segmentos para n puntos', () => {
        const coords = [[0, 0], [1, 0], [1, 1], [0, 1]];
        const lengths = getSegmentLengths(coords);
        expect(lengths).toHaveLength(3);
        lengths.forEach(l => expect(l).toBeGreaterThan(0));
    });
});
