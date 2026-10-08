import { describe, it, expect } from 'vitest';
import { buildAggregateCql, PRECOMPUTED_RESOLUTIONS, nearestPrecomputed } from '@services/hexbinAggregateService';

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

describe('nearestPrecomputed', () => {
    it('devuelve la misma cuando esta precalculada', () => {
        expect(nearestPrecomputed(5)).toBe(5);
    });

    it('cae a la mas fina disponible cuando el zoom pide una que no existe', () => {
        expect(nearestPrecomputed(9)).toBe(8);
        expect(nearestPrecomputed(11)).toBe(8);
    });

    it('devuelve null si ninguna sirve', () => {
        expect(nearestPrecomputed(2)).toBe(null);
        expect(nearestPrecomputed(NaN)).toBe(null);
    });
});
