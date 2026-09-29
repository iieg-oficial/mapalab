import { describe, it, expect } from 'vitest';
import {
    INTENSIDADES, NIVEL_MAXIMO, dentroDe, deslizadorDeNivel, elevacionMinima, extensionDe, nivelDeDeslizador, textoNivel,
} from '@pages/maps/helpers/inundacion';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';

describe('simulación de inundación', () => {
    it('el deslizador da precisión en los primeros metros y llega al máximo', () => {
        expect(nivelDeDeslizador(0)).toBe(0);
        expect(nivelDeDeslizador(20)).toBeLessThan(6);
        expect(nivelDeDeslizador(100)).toBe(NIVEL_MAXIMO);
        [0.5, 3, 20, 150].forEach(nivel => expect(nivelDeDeslizador(deslizadorDeNivel(nivel))).toBeCloseTo(nivel, -0.5));
    });

    it('las intensidades van de menos a más y la ligera no pasa de un par de metros', () => {
        const topes = Object.values(INTENSIDADES).map(i => i.tope);
        expect([...topes].sort((a, b) => a - b)).toEqual(topes);
        expect(INTENSIDADES.ligera.tope).toBeLessThanOrEqual(2);
    });

    it('toma lo más bajo que se ve e ignora los puntos sin terreno', () => {
        expect(elevacionMinima([1540, null, 1512.4, undefined, 1600])).toBe(1512.4);
        expect(elevacionMinima([null])).toBeNull();
        expect(elevacionMinima([0, 1530, 0, 1602])).toBe(1530);
        expect(textoNivel(0.35)).toBe('0.3');
        expect(textoNivel(42.6)).toBe('43');
    });
});

describe('extensión del agua', () => {
    it('sabe qué queda dentro de Jalisco y mide el rectángulo en metros', () => {
        expect(dentroDe(JALISCO_BOUNDS.coords, [-103.35, 20.67])).toBe(true);
        expect(dentroDe(JALISCO_BOUNDS.coords, [-99.13, 19.43])).toBe(false);
        const { centro, ancho, alto } = extensionDe(JALISCO_BOUNDS.coords);
        expect(dentroDe(JALISCO_BOUNDS.coords, centro)).toBe(true);
        expect(ancho).toBeGreaterThan(400000);
        expect(alto).toBeGreaterThan(400000);
    });
});
