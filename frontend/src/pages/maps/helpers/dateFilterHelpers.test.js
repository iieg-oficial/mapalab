import { describe, it, expect } from 'vitest';
import {
    generateCQLFilter,
    parseCQLToSelections,
    generateDefaultDateFilter,
    formatDateString,
    formatIsoAsMonthYear,
    MONTHS,
} from './dateFilterHelpers';

describe('generateCQLFilter', () => {
    it('devuelve null sin selecciones', () => {
        expect(generateCQLFilter(null)).toBeNull();
        expect(generateCQLFilter(new Set())).toBeNull();
    });

    it('genera igualdad exacta para un dia', () => {
        expect(generateCQLFilter(new Set(['2024-3-5']))).toBe("fecha = '2024-03-05'");
    });

    it('genera rango de mes con corte al mes siguiente', () => {
        expect(generateCQLFilter(new Set(['2024-3']))).toBe(
            "(fecha >= '2024-03-01' AND fecha < '2024-04-01')",
        );
    });

    it('cruza al ano siguiente en diciembre', () => {
        expect(generateCQLFilter(new Set(['2024-12']))).toBe(
            "(fecha >= '2024-12-01' AND fecha < '2025-01-01')",
        );
    });

    it('genera rango de ano completo', () => {
        expect(generateCQLFilter(new Set(['2024']))).toBe(
            "(fecha >= '2024-01-01' AND fecha < '2025-01-01')",
        );
    });

    it('combina varias selecciones con OR', () => {
        expect(generateCQLFilter(new Set(['2024-1', '2024-2']))).toBe(
            "((fecha >= '2024-01-01' AND fecha < '2024-02-01') OR (fecha >= '2024-02-01' AND fecha < '2024-03-01'))",
        );
    });

    it('respeta una columna de filtro personalizada', () => {
        expect(generateCQLFilter(new Set(['2024']), 'fecha_evento')).toBe(
            "(fecha_evento >= '2024-01-01' AND fecha_evento < '2025-01-01')",
        );
    });
});

describe('parseCQLToSelections', () => {
    it('devuelve un Set vacio sin filtro', () => {
        expect(parseCQLToSelections(null)).toEqual(new Set());
    });

    it('reconstruye seleccion de dia', () => {
        expect(parseCQLToSelections("fecha = '2024-03-05'")).toEqual(new Set(['2024-3-5']));
    });

    it('reconstruye seleccion de mes', () => {
        expect(
            parseCQLToSelections("(fecha >= '2024-03-01' AND fecha < '2024-04-01')"),
        ).toEqual(new Set(['2024-3']));
    });

    it('reconstruye seleccion de ano', () => {
        expect(
            parseCQLToSelections("(fecha >= '2024-01-01' AND fecha < '2025-01-01')"),
        ).toEqual(new Set(['2024']));
    });

    it('es inverso de generateCQLFilter', () => {
        for (const sel of ['2024-3-5', '2024-7', '2024']) {
            const cql = generateCQLFilter(new Set([sel]));
            expect(parseCQLToSelections(cql)).toEqual(new Set([sel]));
        }
    });
});

describe('generateDefaultDateFilter', () => {
    it('devuelve null sin fecha por defecto', () => {
        expect(generateDefaultDateFilter(null)).toBeNull();
    });

    it('resuelve solo ano', () => {
        expect(generateDefaultDateFilter({ year: 2024 })).toBe(
            "(fecha >= '2024-01-01' AND fecha < '2025-01-01')",
        );
    });

    it('resuelve ano y mes', () => {
        expect(generateDefaultDateFilter({ year: 2024, month: 5 })).toBe(
            "(fecha >= '2024-05-01' AND fecha < '2024-06-01')",
        );
    });

    it('resuelve ano, mes y dia', () => {
        expect(generateDefaultDateFilter({ year: 2024, month: 5, day: 9 })).toBe(
            "fecha = '2024-05-09'",
        );
    });

    it('acepta arreglos de valores', () => {
        expect(generateDefaultDateFilter({ year: [2023, 2024] })).toBe(
            "((fecha >= '2023-01-01' AND fecha < '2024-01-01') OR (fecha >= '2024-01-01' AND fecha < '2025-01-01'))",
        );
    });
});

describe('formatDateString', () => {
    it('devuelve N/A sin valor', () => {
        expect(formatDateString(null)).toBe('N/A');
    });

    it('deja el ano tal cual', () => {
        expect(formatDateString('2024')).toBe('2024');
    });

    it('formatea mes y ano', () => {
        expect(formatDateString('2024-03')).toBe('marzo 2024');
    });

    it('formatea dia, mes y ano', () => {
        expect(formatDateString('2024-03-05')).toBe('5 de marzo de 2024');
    });
});

describe('formatIsoAsMonthYear', () => {
    it('devuelve null para entradas invalidas', () => {
        expect(formatIsoAsMonthYear(null)).toBeNull();
        expect(formatIsoAsMonthYear(2024)).toBeNull();
        expect(formatIsoAsMonthYear('2024')).toBeNull();
    });

    it('formatea una fecha ISO como Mes Ano', () => {
        expect(formatIsoAsMonthYear('2024-03-01')).toBe('Marzo 2024');
    });
});

describe('MONTHS', () => {
    it('tiene los doce meses en orden', () => {
        expect(MONTHS).toHaveLength(12);
        expect(MONTHS[0]).toEqual({ num: 1, name: 'Enero', shortName: 'EN' });
        expect(MONTHS[11]).toEqual({ num: 12, name: 'Diciembre', shortName: 'DI' });
    });
});
