import { describe, it, expect } from 'vitest';
import { buildAggregateCql, PRECOMPUTED_RESOLUTIONS } from '@services/hexbinAggregateService';

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
        expect([...PRECOMPUTED_RESOLUTIONS].sort()).toEqual([3, 4, 6, 7]);
    });

    it('deja fuera las resoluciones finas, que van por cliente', () => {
        [8, 9, 10, 11].forEach(r => expect(PRECOMPUTED_RESOLUTIONS.has(r)).toBe(false));
    });
});
