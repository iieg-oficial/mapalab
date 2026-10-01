import { describe, expect, it } from 'vitest';
import { huellaCono } from '@pages/maps/helpers/dron/camaraDron';
import { indicadoresDeVuelo, reloj, topeDeVuelo } from '@pages/maps/helpers/grabacion/planVuelo';

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

    it('la huella del cono crece con la altura sobre el terreno', () => {
        expect(huellaCono(120)).toEqual({ largo: 96, ancho: 88 });
        expect(huellaCono(240).largo).toBe(191);
        expect(huellaCono(-5)).toEqual({ largo: 0, ancho: 0 });
    });

    it('con el cono el tercer indicador es la huella y si no, el rumbo', () => {
        const base = { kmh: 82, maximoKmh: 120, agl: 120, rumbo: 47 };
        expect(indicadoresDeVuelo(base)[2]).toMatchObject({ tipo: 'brujula', rumbo: 47 });
        expect(indicadoresDeVuelo({ ...base, cono: true })[2]).toMatchObject({ etiqueta: 'CONO', valor: '96×88' });
        expect(indicadoresDeVuelo(base)[0]).toMatchObject({ valor: '82', unidad: 'km/h' });
    });
});
