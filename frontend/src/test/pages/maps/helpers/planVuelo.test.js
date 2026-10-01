import { describe, expect, it } from 'vitest';
import { planDeRuta, reloj, topeDeVuelo } from '@pages/maps/helpers/grabacion/planVuelo';

describe('grabación del vuelo', () => {
    it('el tope es 60 s en escritorio y 30 s en celular', () => {
        expect(topeDeVuelo(false)).toBe(60);
        expect(topeDeVuelo(true)).toBe(30);
    });

    it('el reloj va en minutos y segundos', () => {
        expect(reloj(0)).toBe('00:00');
        expect(reloj(23.7)).toBe('00:23');
        expect(reloj(60)).toBe('01:00');
    });
});

describe('grabar una ruta', () => {
    it('sin ruta graba en tiempo real hasta el tope', () => {
        expect(planDeRuta({ estimadoS: null, tope: 60 })).toEqual({ aceleracion: 1, ritmo: 1, limite: 60, mostrado: 60 });
    });

    it('una ruta corta se vuela a velocidad normal', () => {
        expect(planDeRuta({ estimadoS: 40, tope: 60 })).toMatchObject({ aceleracion: 1, ritmo: 1, mostrado: 40 });
    });

    it('una ruta larga acelera el dron hasta 20× y comprime cuadros si aún no cabe en el tope', () => {
        expect(planDeRuta({ estimadoS: 300, tope: 60 })).toMatchObject({ aceleracion: 5, ritmo: 1, mostrado: 60 });
        const larga = planDeRuta({ estimadoS: 2790, tope: 60 });
        expect(larga.aceleracion).toBe(20);
        expect(larga.mostrado).toBe(140);
        expect(larga.ritmo).toBeCloseTo(2.325, 2);
    });
});
