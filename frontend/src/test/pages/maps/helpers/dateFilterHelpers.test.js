import { describe, it, expect } from 'vitest';
import { formatIsoAsMonthYear } from '@pages/maps/helpers/dateFilterHelpers';

describe('formatIsoAsMonthYear', () => {
    it('formatea una fecha ISO completa como "Mes Año"', () => {
        expect(formatIsoAsMonthYear('2024-01-15')).toBe('Enero 2024');
    });

    it('formatea con solo año y mes', () => {
        expect(formatIsoAsMonthYear('2024-07')).toBe('Julio 2024');
    });

    it('funciona con todos los meses', () => {
        expect(formatIsoAsMonthYear('2024-03-01')).toBe('Marzo 2024');
        expect(formatIsoAsMonthYear('2024-06-01')).toBe('Junio 2024');
        expect(formatIsoAsMonthYear('2024-09-01')).toBe('Septiembre 2024');
        expect(formatIsoAsMonthYear('2024-12-01')).toBe('Diciembre 2024');
    });

    it('retorna null si el input es vacío, null o undefined', () => {
        expect(formatIsoAsMonthYear(null)).toBeNull();
        expect(formatIsoAsMonthYear(undefined)).toBeNull();
        expect(formatIsoAsMonthYear('')).toBeNull();
    });

    it('retorna null si el input no es string', () => {
        expect(formatIsoAsMonthYear(123)).toBeNull();
        expect(formatIsoAsMonthYear({})).toBeNull();
        expect(formatIsoAsMonthYear(['2024', '01'])).toBeNull();
    });

    it('retorna null si la fecha no tiene mes', () => {
        expect(formatIsoAsMonthYear('2024')).toBeNull();
    });

    it('retorna solo el año si el número de mes es inválido', () => {
        expect(formatIsoAsMonthYear('2024-13')).toBe('2024');
        expect(formatIsoAsMonthYear('2024-00')).toBe('2024');
    });

    it('parsea correctamente meses con cero a la izquierda', () => {
        expect(formatIsoAsMonthYear('2024-01-01')).toBe('Enero 2024');
        expect(formatIsoAsMonthYear('2024-09-01')).toBe('Septiembre 2024');
    });
});
