import { describe, it, expect } from 'vitest';
import {
    aLngLat, aMinimapa, aMundo, deMinimapa, teselasVisibles, urlTesela,
} from '@pages/maps/helpers/dron/minimapaDron';

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

    it('pide solo las teselas que tocan la ventana', () => {
        const teselas = teselasVisibles(GDL, 176, 176, 10);
        expect(teselas.length).toBeGreaterThanOrEqual(1);
        expect(teselas.length).toBeLessThanOrEqual(4);
        expect(urlTesela('https://t/{z}/{x}/{y}.png', 10, 1, 2)).toBe('https://t/10/1/2.png');
    });
});
