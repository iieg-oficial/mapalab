import { describe, it, expect } from 'vitest';
import { effectiveResolution } from '@ghegar/panal/ol';
import { buildAggregateCql, PRECOMPUTED_RESOLUTIONS, toAggregatedCells } from '@services/hexbinAggregateService';

describe('buildAggregateCql', () => {
    it('pide el total sin desglose de anio ni municipio', () => {
        const cql = buildAggregateCql(['violencia_familiar'], 7);
        expect(cql).toContain('anio IS NULL');
        expect(cql).toContain('clave_municipio IS NULL');
        expect(cql).toContain('resolution = 7');
    });

    it('junta varios nodos en un solo IN', () => {
        const cql = buildAggregateCql(['primer_nivel', 'segundo_nivel'], 6);
        expect(cql).toContain("layer_key IN ('primer_nivel','segundo_nivel')");
    });

    it('escapa las comillas del identificador', () => {
        expect(buildAggregateCql(["o'brien"], 6)).toContain("'o''brien'");
    });
});

describe('PRECOMPUTED_RESOLUTIONS', () => {
    it('coincide con lo que precalcula el job de dataengine', () => {
        expect([...PRECOMPUTED_RESOLUTIONS].sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7, 8]);
    });

    it('cubre el zoom inicial del visor, que pide la 5', () => {
        expect(PRECOMPUTED_RESOLUTIONS.has(5)).toBe(true);
    });
});

describe('resolución precalculada que elige panal', () => {
    const disponibles = [...PRECOMPUTED_RESOLUTIONS].sort((a, b) => a - b);

    it('devuelve la misma cuando está precalculada', () => {
        expect(effectiveResolution(5, disponibles)).toBe(5);
    });

    it('cae a la más fina disponible cuando el zoom pide una que no existe', () => {
        expect(effectiveResolution(9, disponibles)).toBe(8);
        expect(effectiveResolution(11, disponibles)).toBe(8);
    });
});

describe('toAggregatedCells', () => {
    it('convierte cada fila en una celda de panal, sin geometría', () => {
        const data = { features: [
            { properties: { h3_index: '87498c96effffff', total: 12 } },
            { properties: { h3_index: '87498c968ffffff', total: '3' } }
        ] };
        expect(toAggregatedCells(data)).toEqual([
            { h3Index: '87498c96effffff', value: 12, count: 12 },
            { h3Index: '87498c968ffffff', value: 3, count: 3 }
        ]);
    });

    it('ignora filas sin índice y respuestas vacías', () => {
        expect(toAggregatedCells({ features: [{ properties: { total: 4 } }] })).toEqual([]);
        expect(toAggregatedCells(null)).toEqual([]);
    });
});
