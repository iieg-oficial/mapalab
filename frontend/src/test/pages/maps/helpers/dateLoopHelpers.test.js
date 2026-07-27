import { describe, it, expect } from 'vitest';
import { formatDateFilterPill, formatLoopLabelLong } from '@pages/maps/helpers/dateLoopHelpers';

describe('formatDateFilterPill', () => {
    it('lista los meses cuando son tres o menos', () => {
        expect(formatDateFilterPill({ year: 2024, months: [1, 2, 3], annual: false }))
            .toBe('Enero, Febrero, Marzo de 2024');
    });

    it('resume como rango cuando son más de tres meses contiguos', () => {
        expect(formatDateFilterPill({ year: 2024, months: [1, 2, 3, 4, 5], annual: false }))
            .toBe('Enero a Mayo de 2024');
    });

    it('resume como conteo cuando son más de tres meses sueltos', () => {
        expect(formatDateFilterPill({ year: 2024, months: [1, 3, 6, 11], annual: false }))
            .toBe('4 meses de 2024');
    });

    it('deja intactos el mes único, el año y el multi-año', () => {
        expect(formatDateFilterPill({ year: 2024, months: [7], annual: false })).toBe('Julio de 2024');
        expect(formatDateFilterPill({ year: 2024, months: [], annual: true })).toBe('2024');
        expect(formatDateFilterPill({ multi: true, yearCount: 3 })).toBe('3 años');
        expect(formatDateFilterPill(null)).toBeNull();
    });
});

describe('formatLoopLabelLong', () => {
    it('sin tope sigue listando todos los meses', () => {
        expect(formatLoopLabelLong({ year: 2024, months: [1, 2, 3, 4], annual: false }))
            .toBe('Enero, Febrero, Marzo, Abril de 2024');
    });
});
