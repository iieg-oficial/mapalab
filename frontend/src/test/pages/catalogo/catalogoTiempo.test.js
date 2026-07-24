import { describe, it, expect } from 'vitest';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';
import { describeDateFilter, formatLoopLabelLong, buildLoopValues } from '@pages/maps/helpers/dateLoopHelpers';

const PERIODICIDAD = {
    fecha: {
        2024: { 1: [1], 6: [1] },
        2025: { 3: [1] },
        2026: { 1: [1], 6: [1], 12: [1] },
    },
};

const etiqueta = (cql) => formatLoopLabelLong(describeDateFilter({ filter: cql, rasterPeriodicity: null }));

describe('etiqueta de la pill temporal', () => {
    it('sin filtro no produce etiqueta (la barra muestra el texto por defecto)', () => {
        expect(etiqueta(null)).toBe(null);
    });

    it('el año más reciente se lee de vuelta como año', () => {
        const años = Object.keys(PERIODICIDAD.fecha).map(Number).sort((a, b) => b - a);
        expect(años[0]).toBe(2026);
        expect(etiqueta(generateCQLFilter(new Set([`${años[0]}`])))).toBe('2026');
    });

    it('un mes concreto se lee como mes y año', () => {
        expect(etiqueta(generateCQLFilter(new Set(['2026-6'])))).toBe('Junio de 2026');
    });

    it('varios meses del mismo año se enumeran', () => {
        expect(etiqueta(generateCQLFilter(new Set(['2026-1', '2026-6'])))).toBe('Enero, Junio de 2026');
    });

    it('años distintos se resumen por cantidad', () => {
        expect(etiqueta(generateCQLFilter(new Set(['2024', '2026'])))).toBe('2 años');
    });
});

describe('valores del ciclo de animación', () => {
    it('en modo año recorre los años disponibles, del más reciente al más viejo', () => {
        const values = buildLoopValues({ mode: 'year', periodicity: PERIODICIDAD });
        expect(values.map((v) => v.key)).toEqual([2026, 2025, 2024]);
        expect(values.every((v) => typeof v.filterValue === 'string')).toBe(true);
    });

    it('en modo mes recorre los meses de un año', () => {
        const values = buildLoopValues({ mode: 'month', year: 2026, periodicity: PERIODICIDAD });
        expect(values.map((v) => v.key)).toEqual([1, 6, 12]);
    });

    it('no anima un año con un solo mes', () => {
        expect(buildLoopValues({ mode: 'month', year: 2025, periodicity: PERIODICIDAD })).toEqual([]);
    });

    it('el valor del ciclo se puede volver a leer como etiqueta', () => {
        const [primero] = buildLoopValues({ mode: 'month', year: 2026, periodicity: PERIODICIDAD });
        expect(etiqueta(primero.filterValue)).toBe('Enero de 2026');
    });
});
