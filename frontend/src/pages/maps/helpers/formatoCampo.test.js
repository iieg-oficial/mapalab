import { describe, it, expect } from 'vitest';
import { aplicarFormato } from './formatoCampo';

describe('aplicarFormato', () => {
    it('sin formato deja el valor como viene', () => {
        expect(aplicarFormato('2026-06-01', undefined)).toBe('2026-06-01');
        expect(aplicarFormato('2026-06-01', 'fecha')).toBe('2026-06-01');
    });

    it('con formato anio deja solo el año de una fecha ISO', () => {
        expect(aplicarFormato('2026-06-01', 'anio')).toBe('2026');
        expect(aplicarFormato('2024-01-01Z', 'anio')).toBe('2024');
        expect(aplicarFormato('2024-12-31T00:00:00', 'anio')).toBe('2024');
    });

    it('el 1 de enero no se corre al año anterior por la zona horaria', () => {
        expect(aplicarFormato('2024-01-01', 'anio')).toBe('2024');
    });

    it('acepta un año que ya viene suelto', () => {
        expect(aplicarFormato(2024, 'anio')).toBe('2024');
    });

    it('no toca lo que no es fecha ni lo vacío', () => {
        expect(aplicarFormato('sin fecha', 'anio')).toBe('sin fecha');
        expect(aplicarFormato('', 'anio')).toBe('');
        expect(aplicarFormato(null, 'anio')).toBeNull();
    });
});
