import { describe, it, expect } from 'vitest';
import { animacionDeDato, colorDeFondo, esEventoLite, tramosDeForma } from '@pages/maps/helpers/eventoDiversion';

describe('eventoDiversion', () => {
    it('la animación del dato gana sobre la del evento', () => {
        expect(animacionDeDato({ animacion: 'aguilas' }, { animacion: 'pelota' })).toBe('aguilas');
    });

    it('sin animación propia, el dato toma la del evento', () => {
        expect(animacionDeDato({ animacion: null }, { animacion: 'aguilas' })).toBe('aguilas');
    });

    it('sin ninguna, cae en la pelota', () => {
        expect(animacionDeDato({}, {})).toBe('pelota');
    });

    it('los fondos salen de los tokens de la paleta', () => {
        expect(colorDeFondo('naranja')).toBe('var(--color-orange)');
        expect(colorDeFondo('morado')).toBe('var(--color-purple)');
        expect(colorDeFondo('inexistente')).toBe('#FFFFFF');
    });

    it('cuenta los tramos de cada forma', () => {
        expect([tramosDeForma('ninguno'), tramosDeForma('solido'), tramosDeForma('mitades'), tramosDeForma('tercios')]).toEqual([0, 1, 2, 3]);
        expect(tramosDeForma('rara')).toBe(0);
    });

    it('distingue un evento lite', () => {
        expect(esEventoLite({ modo: 'lite' })).toBe(true);
        expect(esEventoLite({ modo: 'completo' })).toBe(false);
        expect(esEventoLite(null)).toBe(false);
    });
});
