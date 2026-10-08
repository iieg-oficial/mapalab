import { describe, it, expect } from 'vitest';
import { definicionVacia, esCompleta, operadoresDe, MAX_FILTROS, MAX_PROPIAS } from '@hooksMaps/useStatsBuilder';

describe('definicionVacia', () => {
    it('arranca contando registros y sin filtros', () => {
        const def = definicionVacia();
        expect(def.operation).toBe('count');
        expect(def.filters).toEqual([]);
        expect(def.field).toBeNull();
    });

    it('devuelve un objeto nuevo cada vez', () => {
        const a = definicionVacia();
        a.filters.push({ field: 'x' });
        expect(definicionVacia().filters).toEqual([]);
    });
});

describe('operadoresDe', () => {
    it('ofrece igualdad y pertenencia para texto', () => {
        expect(operadoresDe('texto').map(o => o.clave)).toEqual(['eq', 'in']);
    });

    it('ofrece rangos para números', () => {
        expect(operadoresDe('numero').map(o => o.clave)).toEqual(['eq', 'gte', 'lte']);
    });

    it('ofrece desde y hasta para fechas', () => {
        expect(operadoresDe('fecha').map(o => o.clave)).toEqual(['gte', 'lte']);
    });

    it('cae en texto ante un tipo desconocido', () => {
        expect(operadoresDe(undefined).map(o => o.clave)).toEqual(['eq', 'in']);
    });
});

describe('esCompleta', () => {
    const base = { operation: 'count', field: null, label: 'Secundarias', filters: [] };

    it('exige nombre', () => {
        expect(esCompleta({ ...base, label: '' })).toBe(false);
        expect(esCompleta({ ...base, label: '   ' })).toBe(false);
        expect(esCompleta(base)).toBe(true);
    });

    it('exige que cada filtro tenga columna y valor', () => {
        expect(esCompleta({ ...base, filters: [{ field: 'nivel', op: 'eq', value: null }] })).toBe(false);
        expect(esCompleta({ ...base, filters: [{ field: null, op: 'eq', value: 'x' }] })).toBe(false);
        expect(esCompleta({ ...base, filters: [{ field: 'nivel', op: 'eq', value: 'Secundaria' }] })).toBe(true);
    });

    it('acepta el cero como valor', () => {
        expect(esCompleta({ ...base, filters: [{ field: 'alumnos', op: 'gte', value: 0 }] })).toBe(true);
    });

    it('no pide valor a is_not_null', () => {
        expect(esCompleta({ ...base, filters: [{ field: 'nivel', op: 'is_not_null', value: null }] })).toBe(true);
    });
});

describe('topes', () => {
    it('respeta el tope de filtros del motor', () => {
        expect(MAX_FILTROS).toBe(6);
    });

    it('limita las estadísticas propias por capa', () => {
        expect(MAX_PROPIAS).toBeGreaterThan(0);
        expect(MAX_PROPIAS).toBeLessThanOrEqual(8);
    });
});
