import { describe, it, expect } from 'vitest';
import { formatNumber } from '@pages/maps/helpers/formatNumber';

const NBSP = ' ';

describe('formatNumber', () => {
    it('retorna el valor sin cambios si es null, undefined o vacío', () => {
        expect(formatNumber(null)).toBeNull();
        expect(formatNumber(undefined)).toBeUndefined();
        expect(formatNumber('')).toBe('');
    });

    it('no formatea números con 3 dígitos o menos', () => {
        expect(formatNumber(0)).toBe('0');
        expect(formatNumber(123)).toBe('123');
        expect(formatNumber(-99)).toBe('-99');
    });

    it('formatea miles con NBSP', () => {
        expect(formatNumber(1234)).toBe(`1${NBSP}234`);
        expect(formatNumber(1234567)).toBe(`1${NBSP}234${NBSP}567`);
    });

    it('formatea negativos preservando el signo', () => {
        expect(formatNumber(-1234)).toBe(`-1${NBSP}234`);
    });

    it('preserva la parte decimal sin formatearla', () => {
        expect(formatNumber('1234.5678')).toBe(`1${NBSP}234.5678`);
    });

    it('retorna el string original si la parte entera no es numérica', () => {
        expect(formatNumber('abc1234')).toBe('abc1234');
    });
});
