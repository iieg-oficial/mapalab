import { describe, it, expect } from 'vitest';
import { buildLegendGraphicUrl } from '@pages/maps/helpers/legendUrl';
import { parseTimeDimensionToPeriodicity } from '@services/wmsCapabilitiesService';

describe('buildLegendGraphicUrl', () => {
    it('arma la petición base sin filtro', () => {
        const u = buildLegendGraphicUrl({ baseUrl: 'https://x/geoserver/ws/wms', layerName: 'ws:capa' });
        expect(u).toContain('request=GetLegendGraphic');
        expect(u).toContain('layer=ws:capa');
        expect(u).not.toContain('CQL_FILTER');
        expect(u).not.toContain('hideEmptyRules');
    });

    it('pasa el CQL_FILTER (codificado) y activa hideEmptyRules cuando hay filtro', () => {
        const u = buildLegendGraphicUrl({
            baseUrl: 'https://x/geoserver/ws/wms',
            layerName: 'ws:capa',
            cqlFilter: "fecha = '2026-06-01'",
            hideEmptyRules: true,
        });
        expect(u).toContain(`CQL_FILTER=${encodeURIComponent("fecha = '2026-06-01'")}`);
        expect(u).toContain('hideEmptyRules:true');
    });

    it('no activa hideEmptyRules sin filtro aunque se pida', () => {
        const u = buildLegendGraphicUrl({
            baseUrl: 'https://x/geoserver/ws/wms',
            layerName: 'ws:capa',
            hideEmptyRules: true,
        });
        expect(u).not.toContain('hideEmptyRules');
    });

    it('resuelve el STYLE por fecha con timeStylePattern', () => {
        const u = buildLegendGraphicUrl({
            baseUrl: 'https://x/geoserver/raster/wms',
            layerName: 'raster:lluvia',
            timeStylePattern: 'lluvia_total_mensual_{year}_{month}',
            dateValue: '2026-06',
        });
        expect(u).toContain('STYLE=lluvia_total_mensual_2026_06');
    });

    it('usa el styles fijo cuando no hay patrón temporal', () => {
        const u = buildLegendGraphicUrl({
            baseUrl: 'https://x/geoserver/ws/wms',
            layerName: 'ws:capa',
            styles: 'mi_estilo',
        });
        expect(u).toContain('STYLE=mi_estilo');
    });

    it('devuelve null sin baseUrl o layerName', () => {
        expect(buildLegendGraphicUrl({ layerName: 'x' })).toBe(null);
        expect(buildLegendGraphicUrl({ baseUrl: 'x' })).toBe(null);
    });
});

describe('parseTimeDimensionToPeriodicity', () => {
    it('agrupa los valores TIME por año y mes con su ISO', () => {
        const fecha = parseTimeDimensionToPeriodicity(
            '2025-11-01T00:00:00.000Z,2025-12-01T00:00:00.000Z,2026-01-01T00:00:00.000Z',
        );
        expect(Object.keys(fecha)).toEqual(['2025', '2026']);
        expect(fecha[2025][11]).toBe('2025-11-01');
        expect(fecha[2026][1]).toBe('2026-01-01');
    });

    it('tolera valores sin sufijo de hora', () => {
        const fecha = parseTimeDimensionToPeriodicity('2026-03-01,2026-04-01');
        expect(fecha[2026][3]).toBe('2026-03-01');
        expect(fecha[2026][4]).toBe('2026-04-01');
    });

    it('devuelve null para entradas vacías o inválidas', () => {
        expect(parseTimeDimensionToPeriodicity('')).toBe(null);
        expect(parseTimeDimensionToPeriodicity(null)).toBe(null);
        expect(parseTimeDimensionToPeriodicity('no-es-fecha')).toBe(null);
    });
});
