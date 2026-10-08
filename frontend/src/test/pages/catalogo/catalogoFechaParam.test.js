import { describe, it, expect } from 'vitest';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';
import { fechaParamToFiltro, filtroToFechaParam } from '@pages/catalogo/helpers/catalogoRoutes';

const RASTER = {
    2025: { 11: '2025-11-01', 12: '2025-12-01' },
    2026: { 1: '2026-01-01', 3: '2026-03-01' },
};

const raster = { isRaster: true, periodicidad: RASTER };

describe('?fecha= en capas vectoriales', () => {
    it('ida y vuelta de un año', () => {
        const cql = fechaParamToFiltro('2026');
        expect(cql).toBe(generateCQLFilter(new Set(['2026'])));
        expect(filtroToFechaParam(cql)).toBe('2026');
    });

    it('ida y vuelta de varios meses', () => {
        const cql = fechaParamToFiltro('2026-1,2026-6');
        expect(filtroToFechaParam(cql)).toBe('2026-1,2026-6');
    });

    it('sin filtro no hay parámetro', () => {
        expect(filtroToFechaParam(null)).toBe(null);
        expect(fechaParamToFiltro(null)).toBe(null);
    });
});

describe('?fecha= en capas raster', () => {
    it('el valor TIME se comparte como año-mes', () => {
        expect(filtroToFechaParam('2026-03-01', raster)).toBe('2026-3');
    });

    it('el año-mes vuelve al valor TIME de la capa', () => {
        expect(fechaParamToFiltro('2026-3', raster)).toBe('2026-03-01');
    });

    it('un año solo toma el último mes disponible', () => {
        expect(fechaParamToFiltro('2025', raster)).toBe('2025-12-01');
    });

    it('una fecha que la capa no tiene no produce filtro', () => {
        expect(fechaParamToFiltro('2026-6', raster)).toBe(null);
        expect(fechaParamToFiltro('2019', raster)).toBe(null);
        expect(filtroToFechaParam('2019-01-01', raster)).toBe(null);
    });

    it('nunca produce CQL para un raster', () => {
        expect(fechaParamToFiltro('2026-3', raster)).not.toMatch(/fecha/);
    });
});
