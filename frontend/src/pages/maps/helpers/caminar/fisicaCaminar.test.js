import { describe, it, expect } from 'vitest';
import { prepararEdificio } from './geometriaEdificio';
import { crearCaminante, pasoCaminante, pisoActual } from './fisicaCaminar';

const caja = (x0, y0, x1, y1) => [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];

const DATOS = {
    origen: { lng: -103.44, lat: 20.68 },
    pisos: [
        { id: 1, nombre: 'Planta baja', orden: 0, nivel: 0, altura: 3, transitable: true, conPlano: true },
        { id: 2, nombre: 'Planta alta', orden: 1, nivel: 3, altura: 3, transitable: true, conPlano: false },
        { id: 3, nombre: 'Azotea', orden: 2, nivel: 6, altura: 0, transitable: true, conPlano: false },
    ],
    espacios: [{ fid: 1, nombre: 'Sala', tipo: 'sala', pisoId: 1, poligonos: [caja(0, 0, 10, 10)] }],
    elementos: [
        { fid: 1, tipo: 'muro', pisoId: 1, base: 0, altura: null, aproximado: false, poligonos: [caja(5, 0, 5.2, 4)] },
        { fid: 2, tipo: 'escalera', pisoId: 1, base: 0, altura: null, aproximado: true, poligonos: [caja(1, 6, 7, 8)] },
        { fid: 3, tipo: 'volumen', pisoId: 2, base: 0, altura: null, aproximado: true, poligonos: [caja(0.5, 5.5, 9, 9.5)] },
    ],
};

const andar = (c, edificio, entrada, pasos) => Array.from({ length: pasos }).reduce(
    actual => pasoCaminante(actual, { giro: 0, correr: false, ...entrada }, edificio, 0.05, () => 0),
    c,
);

describe('fisicaCaminar', () => {
    const edificio = prepararEdificio(DATOS);

    it('detiene a la persona contra un muro', () => {
        const c = andar(crearCaminante(3, 2, 0, 90), edificio, { avance: 1, lateral: 0 }, 80);
        expect(c.x).toBeLessThan(5);
        expect(c.x).toBeGreaterThan(4.6);
    });

    it('sube el primer tramo hasta el descanso de la planta alta', () => {
        const c = andar(crearCaminante(0.6, 6.5, 0, 90), edificio, { avance: 1, lateral: 0 }, 90);
        expect(c.z).toBeCloseTo(3, 1);
        expect(pisoActual(edificio, c.z).nombre).toBe('Planta alta');
    });

    it('llega a la azotea por el segundo tramo', () => {
        const arriba = crearCaminante(6.6, 7.5, 3, 270);
        const c = andar(arriba, edificio, { avance: 1, lateral: 0 }, 120);
        expect(c.z).toBeCloseTo(6, 1);
        expect(pisoActual(edificio, c.z).nombre).toBe('Azotea');
    });

    it('no salta de un tramo al otro a media escalera', () => {
        const enMedio = crearCaminante(3, 6.5, 1.2, 0);
        const c = andar(enMedio, edificio, { avance: 1, lateral: 0 }, 30);
        expect(c.z).toBeLessThan(3);
    });
});
