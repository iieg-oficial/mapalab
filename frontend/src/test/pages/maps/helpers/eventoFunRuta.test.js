import { describe, it, expect } from 'vitest';
import { tieneRuta, verticesDeDestino } from '@pages/maps/helpers/eventoFunRuta';

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
});
