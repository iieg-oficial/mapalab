import { describe, it, expect } from 'vitest';
import {
    aLngLat, aMinimapa, aMundo, deMinimapa, largoDeRuta, teselasVisibles, urlTesela,
} from '@pages/maps/helpers/dron/minimapaDron';
import { puntoDelClic } from '@pages/maps/helpers/dron/dibujoMinimapa';

const GDL = [-103.35, 20.67];

describe('minimapa del dron', () => {
    it('ida y vuelta entre coordenadas y píxeles del mundo', () => {
        const [lng, lat] = aLngLat(aMundo(GDL, 10), 10);
        expect(lng).toBeCloseTo(GDL[0], 6);
        expect(lat).toBeCloseTo(GDL[1], 6);
    });

    it('el centro del minimapa es el dron y un clic se convierte en destino', () => {
        expect(aMinimapa(GDL, GDL, 176, 176, 10)).toEqual([88, 88]);
        const destino = deMinimapa(GDL, [176, 88], 176, 176, 10);
        expect(destino[0]).toBeGreaterThan(GDL[0]);
        expect(destino[1]).toBeCloseTo(GDL[1], 6);
    });

    it('mide la ruta desde el dron y cierra el ciclo cuando se repite', () => {
        const este = aLngLat([aMundo(GDL, 10)[0] + 100, aMundo(GDL, 10)[1]], 10);
        const norte = aLngLat([aMundo(GDL, 10)[0], aMundo(GDL, 10)[1] - 100], 10);
        const abierta = largoDeRuta(GDL, [este, norte]);
        expect(abierta).toBeGreaterThan(0);
        expect(largoDeRuta(GDL, [este, norte], true)).toBeGreaterThan(abierta);
        expect(largoDeRuta(GDL, [])).toBe(0);
    });

    it('con rumbo arriba, un clic adelante del dron cae hacia donde apunta', () => {
        const vista = { centro: GDL, ancho: 200, alto: 200, zoom: 10, rumbo: 90, rumboArriba: true };
        const [lng, lat] = puntoDelClic(vista, [100, 20]);
        expect(lng).toBeGreaterThan(GDL[0]);
        expect(lat).toBeCloseTo(GDL[1], 3);
        const [lngNorte] = puntoDelClic({ ...vista, rumboArriba: false }, [100, 20]);
        expect(lngNorte).toBeCloseTo(GDL[0], 6);
    });

    it('pide solo las teselas que tocan la ventana', () => {
        const teselas = teselasVisibles(GDL, 176, 176, 10);
        expect(teselas.length).toBeGreaterThanOrEqual(1);
        expect(teselas.length).toBeLessThanOrEqual(4);
        expect(urlTesela('https://t/{z}/{x}/{y}.png', 10, 1, 2)).toBe('https://t/10/1/2.png');
    });
});
