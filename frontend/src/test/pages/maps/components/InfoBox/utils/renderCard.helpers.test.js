import { describe, it, expect } from 'vitest';
import { applyHeaderTransform, resolveStaticValue } from '@pages/maps/components/InfoBox/utils/renderCard';

describe('applyHeaderTransform', () => {
    it('retorna el valor sin cambios si no hay transform', () => {
        expect(applyHeaderTransform(null, 'capa', null)).toBe('capa');
        expect(applyHeaderTransform(undefined, 'capa', null)).toBe('capa');
    });

    it('aplica valueMap cuando hay coincidencia', () => {
        const transform = { valueMap: { P: 'Principal', S: 'Secundario' } };
        expect(applyHeaderTransform(transform, 'P', null)).toBe('Principal');
        expect(applyHeaderTransform(transform, 'S', null)).toBe('Secundario');
    });

    it('mantiene el valor original si valueMap no tiene coincidencia', () => {
        const transform = { valueMap: { P: 'Principal' } };
        expect(applyHeaderTransform(transform, 'X', null)).toBe('X');
    });

    it('agrega el sufijo ifMatch cuando featureId contiene match', () => {
        const transform = {
            featureIdSuffix: { match: 'secundario', ifMatch: '(Trasera)', ifNoMatch: '(Frontal)' }
        };
        expect(applyHeaderTransform(transform, 'Calle', 'algo.secundario.123')).toBe('Calle (Trasera)');
    });

    it('agrega el sufijo ifNoMatch cuando featureId no contiene match', () => {
        const transform = {
            featureIdSuffix: { match: 'secundario', ifMatch: '(Trasera)', ifNoMatch: '(Frontal)' }
        };
        expect(applyHeaderTransform(transform, 'Calle', 'algo.principal.123')).toBe('Calle (Frontal)');
    });

    it('no agrega sufijo si la alternativa es string vacío', () => {
        const transform = {
            featureIdSuffix: { match: 'secundario', ifMatch: '(Trasera)', ifNoMatch: '' }
        };
        expect(applyHeaderTransform(transform, 'Calle', 'algo.principal.123')).toBe('Calle');
    });

    it('trata featureId null como "no match"', () => {
        const transform = {
            featureIdSuffix: { match: 'secundario', ifMatch: '(Trasera)', ifNoMatch: '(Frontal)' }
        };
        expect(applyHeaderTransform(transform, 'Calle', null)).toBe('Calle (Frontal)');
    });

    it('compone valueMap y featureIdSuffix en ese orden', () => {
        const transform = {
            valueMap: { P: 'Primaria' },
            featureIdSuffix: { match: 'secundario', ifMatch: '(Trasera)', ifNoMatch: '(Frontal)' }
        };
        expect(applyHeaderTransform(transform, 'P', 'x.secundario')).toBe('Primaria (Trasera)');
        expect(applyHeaderTransform(transform, 'P', 'x.principal')).toBe('Primaria (Frontal)');
    });
});

describe('resolveStaticValue', () => {
    it('retorna el valor sin cambios si es primitivo', () => {
        expect(resolveStaticValue('2024', null)).toBe('2024');
        expect(resolveStaticValue(42, null)).toBe(42);
        expect(resolveStaticValue(null, null)).toBeNull();
    });

    it('retorna el valor sin cambios si es objeto sin "dynamic"', () => {
        const value = { label: 'Texto' };
        expect(resolveStaticValue(value, '2024-01-01')).toBe(value);
    });

    it('resuelve dynamic=rasterDate con dateValue válido', () => {
        const value = { dynamic: 'rasterDate', fallback: '2024' };
        expect(resolveStaticValue(value, '2024-03-01')).toBe('Marzo 2024');
    });

    it('usa fallback si dateValue es null', () => {
        const value = { dynamic: 'rasterDate', fallback: '2024' };
        expect(resolveStaticValue(value, null)).toBe('2024');
    });

    it('usa fallback si dateValue no se puede formatear', () => {
        const value = { dynamic: 'rasterDate', fallback: '2024' };
        expect(resolveStaticValue(value, '2024')).toBe('2024');
        expect(resolveStaticValue(value, '')).toBe('2024');
        expect(resolveStaticValue(value, undefined)).toBe('2024');
    });

    it('desconocido dynamic tag retorna el objeto tal cual', () => {
        const value = { dynamic: 'otro', fallback: 'x' };
        expect(resolveStaticValue(value, '2024-01-01')).toBe(value);
    });
});
