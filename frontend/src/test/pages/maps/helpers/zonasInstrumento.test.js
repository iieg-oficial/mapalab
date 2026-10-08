import { describe, expect, it } from 'vitest';
import { zonaDelInstrumento } from '@pages/maps/helpers/dron/instrumentosDron';

describe('zonas de clic de los instrumentos del dron', () => {
    it('la izquierda es el altímetro, el centro el velocímetro y la derecha no responde', () => {
        expect(zonaDelInstrumento(40)).toBe('altimetro');
        expect(zonaDelInstrumento(200)).toBe('velocimetro');
        expect(zonaDelInstrumento(345)).toBeNull();
    });
});
