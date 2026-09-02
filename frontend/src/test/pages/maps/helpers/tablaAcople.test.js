import { describe, it, expect } from 'vitest';
import {
    estiloDelPanel,
    margenesDelMapa,
    medidasDeAcople,
    zonaDeSnap,
} from '@pages/maps/helpers/tablaAcople';

const ventana = { ancho: 1000, alto: 800 };

describe('zonaDeSnap', () => {
    it('detecta cada borde dentro del margen', () => {
        expect(zonaDeSnap({ x: 500, y: 10, ...ventana })).toBe('arriba');
        expect(zonaDeSnap({ x: 10, y: 400, ...ventana })).toBe('izquierda');
        expect(zonaDeSnap({ x: 990, y: 400, ...ventana })).toBe('derecha');
        expect(zonaDeSnap({ x: 500, y: 790, ...ventana })).toBe('abajo');
    });

    it('el borde inferior gana sobre los laterales en las esquinas', () => {
        expect(zonaDeSnap({ x: 5, y: 795, ...ventana })).toBe('abajo');
    });

    it('en el centro no hay zona', () => {
        expect(zonaDeSnap({ x: 500, y: 400, ...ventana })).toBeNull();
        expect(zonaDeSnap({ x: NaN, y: 400, ...ventana })).toBeNull();
    });
});

describe('medidasDeAcople', () => {
    it('los laterales toman ancho y los de abajo alto', () => {
        expect(medidasDeAcople('izquierda', ventana)).toEqual({ ancho: 420, alto: 800 });
        expect(medidasDeAcople('abajo', ventana)).toEqual({ ancho: 1000, alto: 320 });
        expect(medidasDeAcople('flotante', ventana)).toBeNull();
    });
});

describe('estiloDelPanel y margenesDelMapa', () => {
    it('el panel se pega a su borde', () => {
        expect(estiloDelPanel('derecha', ventana)).toEqual({ right: 0, top: 0, bottom: 0, width: 420 });
        expect(estiloDelPanel('abajo', ventana)).toEqual({ left: 0, right: 0, bottom: 0, height: 320 });
        expect(estiloDelPanel('arriba', ventana)).toEqual({ left: 0, right: 0, top: 0, height: 320 });
        expect(estiloDelPanel('flotante', ventana)).toBeNull();
    });

    it('el mapa cede exactamente lo que ocupa el panel', () => {
        expect(margenesDelMapa('izquierda', ventana)).toEqual({ left: 420, right: 0, top: 0, bottom: 0 });
        expect(margenesDelMapa('abajo', ventana)).toEqual({ left: 0, right: 0, top: 0, bottom: 320 });
        expect(margenesDelMapa('arriba', ventana)).toEqual({ left: 0, right: 0, top: 320, bottom: 0 });
        expect(margenesDelMapa('flotante', ventana)).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
    });
});
