import { describe, it, expect } from 'vitest';
import { extentDeRuta, longitudDeRuta, puntoEnRuta, rumboEntre, tieneRuta, verticesDeDestino } from '@pages/maps/helpers/eventoFunRuta';

describe('eventoFunRuta', () => {
    const destino = { lon: -103.6089, lat: 19.8572, zoom: 13 };

    it('sin destino no hay vertices', () => {
        expect(verticesDeDestino(null)).toEqual([]);
        expect(verticesDeDestino({ lon: -103 })).toEqual([]);
        expect(tieneRuta(null)).toBe(false);
    });

    it('un destino sin ruta es un solo vertice', () => {
        expect(verticesDeDestino(destino)).toEqual([[-103.6089, 19.8572]]);
        expect(tieneRuta(destino)).toBe(false);
    });

    it('la ruta va antes del destino y termina en el', () => {
        const conRuta = { ...destino, ruta: [{ lon: -103.5931, lat: 20.2441 }, { lon: -103.5665, lat: 19.9661 }] };
        expect(verticesDeDestino(conRuta)).toEqual([
            [-103.5931, 20.2441],
            [-103.5665, 19.9661],
            [-103.6089, 19.8572],
        ]);
        expect(tieneRuta(conRuta)).toBe(true);
    });

    it('descarta los puntos incompletos de la ruta', () => {
        const sucia = { ...destino, ruta: [{ lon: -103.59 }, null, { lon: -103.5665, lat: 19.9661 }] };
        expect(verticesDeDestino(sucia)).toEqual([[-103.5665, 19.9661], [-103.6089, 19.8572]]);
    });

    const zacoalco = [-103.5931, 20.2441];
    const sayula = [-103.6089, 19.8572];

    it('mide la ruta en metros', () => {
        expect(longitudDeRuta([zacoalco])).toBe(0);
        const km = longitudDeRuta([zacoalco, sayula]) / 1000;
        expect(km).toBeGreaterThan(42);
        expect(km).toBeLessThan(45);
    });

    it('camina la ruta por longitud de arco', () => {
        expect(puntoEnRuta([zacoalco, sayula], 0)).toEqual(zacoalco);
        expect(puntoEnRuta([zacoalco, sayula], 1)).toEqual(sayula);
        const medio = puntoEnRuta([zacoalco, sayula], 0.5);
        expect(medio[1]).toBeCloseTo((zacoalco[1] + sayula[1]) / 2, 4);
        expect(puntoEnRuta([], 0.5)).toBeNull();
    });

    it('el rumbo de Zacoalco a Sayula apunta al sur', () => {
        expect(rumboEntre(zacoalco, sayula)).toBeGreaterThan(175);
        expect(rumboEntre(zacoalco, sayula)).toBeLessThan(190);
        expect(rumboEntre(zacoalco, [zacoalco[0], 21])).toBeCloseTo(0, 1);
    });

    it('el extent cubre todos los vertices', () => {
        expect(extentDeRuta([zacoalco, sayula])).toEqual([-103.6089, 19.8572, -103.5931, 20.2441]);
        expect(extentDeRuta([])).toBeNull();
    });
});
