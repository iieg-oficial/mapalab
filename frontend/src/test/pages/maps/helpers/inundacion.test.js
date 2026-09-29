import { describe, it, expect } from 'vitest';
import {
    INTENSIDADES, NIVEL_MAXIMO, deslizadorDeNivel, elevacionMinima, nivelDeDeslizador, textoNivel,
} from '@pages/maps/helpers/inundacion';

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
        expect(textoNivel(0.35)).toBe('0.3');
        expect(textoNivel(42.6)).toBe('43');
    });
});
