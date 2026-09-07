import { describe, it, expect } from 'vitest';
import { estiloDelPanel, margenesDelMapa, medidasDeAcople, zonaDeSnap, normalizarAcople } from '@pages/maps/helpers/tablaAcople';

const ventana = { ancho: 1000, alto: 800 };

describe('zonaDeSnap', () => {
    it('solo el borde inferior acopla', () => {
        expect(zonaDeSnap({ y: 790, ...ventana })).toBe('abajo');
        expect(zonaDeSnap({ y: 400, ...ventana })).toBeNull();
        expect(zonaDeSnap({ y: 10, ...ventana })).toBeNull();
        expect(zonaDeSnap({ y: NaN, ...ventana })).toBeNull();
    });
});

describe('medidasDeAcople', () => {
    it('el panel toma el 40 % del alto y todo el ancho', () => {
        expect(medidasDeAcople('abajo', ventana)).toEqual({ ancho: 1000, alto: 320 });
        expect(medidasDeAcople('flotante', ventana)).toBeNull();
    });
});

describe('estiloDelPanel y margenesDelMapa', () => {
    it('el panel se pega al borde inferior', () => {
        expect(estiloDelPanel('abajo', ventana)).toEqual({ left: 0, right: 0, bottom: 0, height: 320 });
        expect(estiloDelPanel('flotante', ventana)).toBeNull();
    });

    it('el mapa cede exactamente lo que ocupa el panel', () => {
        expect(margenesDelMapa('abajo', ventana)).toEqual({ left: 0, right: 0, top: 0, bottom: 320 });
        expect(margenesDelMapa('flotante', ventana)).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
    });
});

describe('normalizarAcople', () => {
    it('acepta los modos validos', () => {
        expect(normalizarAcople('flotante')).toBe('flotante');
        expect(normalizarAcople('abajo')).toBe('abajo');
    });

    it('cae a flotante ante un modo desconocido', () => {
        expect(normalizarAcople('izquierda')).toBe('flotante');
    });

    it('cae a flotante ante lo que venga de un storage corrupto', () => {
        expect(normalizarAcople(undefined)).toBe('flotante');
        expect(normalizarAcople(null)).toBe('flotante');
        expect(normalizarAcople('')).toBe('flotante');
        expect(normalizarAcople(42)).toBe('flotante');
    });
});
