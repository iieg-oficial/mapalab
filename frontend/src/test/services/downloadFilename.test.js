import { describe, it, expect } from 'vitest';
import { buildFilename, resolveFilterDateLabel } from '@services/downloadFilename';

const PERIODICIDAD = {
    2025: { 11: '2025-11-01', 12: '2025-12-01' },
    2026: { 1: '2026-01-01', 2: '2026-02-01' },
};

const HOY = new Date().toISOString().slice(0, 10);

describe('resolveFilterDateLabel — raster', () => {
    it('traduce el valor TIME al mes de la periodicidad', () => {
        expect(resolveFilterDateLabel({ filter: '2026-01-01', rasterPeriodicity: PERIODICIDAD })).toBe('2026-01');
    });

    it('distingue meses de años distintos', () => {
        expect(resolveFilterDateLabel({ filter: '2025-12-01', rasterPeriodicity: PERIODICIDAD })).toBe('2025-12');
    });

    it('cae al valor ISO cuando la capa no tiene periodicidad', () => {
        expect(resolveFilterDateLabel({ filter: '2026-01-01' })).toBe('2026-01-01');
    });

    it('retorna null sin filtro', () => {
        expect(resolveFilterDateLabel({ filter: null, rasterPeriodicity: PERIODICIDAD })).toBeNull();
    });
});

describe('resolveFilterDateLabel — vectorial', () => {
    it('resuelve un mes desde el CQL', () => {
        const cql = "(fecha >= '2026-01-01' AND fecha < '2026-02-01')";
        expect(resolveFilterDateLabel({ filter: cql })).toBe('2026-01');
    });

    it('resuelve un año completo', () => {
        const cql = "(fecha >= '2026-01-01' AND fecha < '2027-01-01')";
        expect(resolveFilterDateLabel({ filter: cql })).toBe('2026');
    });

    it('resuelve varios meses como rango', () => {
        const cql = "((fecha >= '2026-01-01' AND fecha < '2026-02-01') OR (fecha >= '2026-03-01' AND fecha < '2026-04-01'))";
        expect(resolveFilterDateLabel({ filter: cql })).toBe('2026-01_a_2026-03');
    });

    it('resuelve un día exacto', () => {
        expect(resolveFilterDateLabel({ filter: "fecha = '2026-01-15'" })).toBe('2026-01');
    });

    it('resuelve varios años como rango de fechas', () => {
        const cql = "((fecha >= '2024-01-01' AND fecha < '2025-01-01') OR (fecha >= '2026-01-01' AND fecha < '2027-01-01'))";
        expect(resolveFilterDateLabel({ filter: cql })).toBe('2024-01-01_a_2026-12-31');
    });

    it('retorna null ante un filtro sin fechas', () => {
        expect(resolveFilterDateLabel({ filter: "municipio = '039'" })).toBeNull();
    });
});

describe('buildFilename', () => {
    it('usa la fecha del filtro cuando existe', () => {
        expect(buildFilename('Temperatura media', 'tiff', { filter: '2026-01-01', rasterPeriodicity: PERIODICIDAD }))
            .toBe('Temperatura_media_2026-01.tiff');
    });

    it('cae a la fecha de descarga sin filtro', () => {
        expect(buildFilename('Temperatura media', 'tiff')).toBe(`Temperatura_media_${HOY}.tiff`);
    });

    it('colapsa los espacios del label', () => {
        expect(buildFilename('  Capa   con  espacios ', 'csv', { filter: '2026-02-01', rasterPeriodicity: PERIODICIDAD }))
            .toBe('Capa_con_espacios_2026-02.csv');
    });

    it('usa capa como label de respaldo', () => {
        expect(buildFilename(null, 'csv', { filter: '2026-02-01', rasterPeriodicity: PERIODICIDAD }))
            .toBe('capa_2026-02.csv');
    });
});
