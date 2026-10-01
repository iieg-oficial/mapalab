import { describe, expect, it } from 'vitest';
import { acumulados, caminoDelRecorrido, puntoEn } from '@pages/maps/helpers/grabacion/animarRecorrido';

const dron = { lngLat: [-103.3, 20.6] };

describe('animación del recorrido', () => {
    it('anima la ruta trazada y, en ciclo, regresa al primer punto', () => {
        const ruta = { puntos: [[-103.2, 20.7], [-103.1, 20.6]], ciclo: true };
        expect(caminoDelRecorrido({ dron, ruta, rastro: [] })).toEqual({ puntos: [dron.lngLat, ...ruta.puntos, ruta.puntos[0]], marcas: 2 });
    });

    it('sin ruta anima el rastro del vuelo, y sin rastro no hay nada que animar', () => {
        const rastro = [[-103.5, 20.5], [-103.4, 20.55]];
        expect(caminoDelRecorrido({ dron, ruta: { puntos: [] }, rastro })).toEqual({ puntos: [...rastro, dron.lngLat], marcas: 0 });
        expect(caminoDelRecorrido({ dron, ruta: { puntos: [] }, rastro: [] }).puntos).toEqual([]);
    });

    it('avanza a velocidad pareja por largo, no por tramo', () => {
        const pixeles = [[0, 0], [100, 0], [100, 300]];
        const largos = acumulados(pixeles);
        expect(largos).toEqual([0, 100, 400]);
        expect(puntoEn(pixeles, largos, 0.25).punto).toEqual([100, 0]);
        expect(puntoEn(pixeles, largos, 0.5).punto).toEqual([100, 100]);
        expect(puntoEn(pixeles, largos, 1).punto).toEqual([100, 300]);
    });
});
