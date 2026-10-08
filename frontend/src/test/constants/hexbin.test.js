import { describe, it, expect } from 'vitest';
import { resolutionForZoom, HEXBIN_RESOLUTION_BY_ZOOM, HEXBIN_MAX_RESOLUTION, HEXBIN_CELL_SIDE_METERS } from '@constants/hexbin';

describe('resolutionForZoom', () => {
    it('da celdas grandes cuando se ve todo el estado', () => {
        expect(resolutionForZoom(5)).toBe(3);
        expect(resolutionForZoom(8)).toBe(5);
    });

    it('afina al acercarse', () => {
        expect(resolutionForZoom(12)).toBe(8);
        expect(resolutionForZoom(15)).toBe(10);
    });

    it('mantiene entre 11 y 48 celdas a lo ancho en todo el rango util', () => {
        const LAT = 20.67;
        const VIEWPORT_PX = 1200;
        const anchoVisible = (z) => (156543.03392 * Math.cos(LAT * Math.PI / 180) / (2 ** z)) * VIEWPORT_PX;

        for (let zoom = 5; zoom <= 18; zoom += 1) {
            const lado = HEXBIN_CELL_SIDE_METERS[resolutionForZoom(zoom)];
            const celdas = anchoVisible(zoom) / (2 * lado);
            expect(celdas).toBeGreaterThan(10);
            expect(celdas).toBeLessThan(50);
        }
    });

    it('topa en la resolución máxima', () => {
        expect(resolutionForZoom(20)).toBe(HEXBIN_MAX_RESOLUTION);
    });

    it('nunca baja al acercarse: la tabla es monótona', () => {
        const resoluciones = [4, 6, 8, 10, 12, 14, 16, 18, 20].map(resolutionForZoom);
        const ordenada = [...resoluciones].sort((a, b) => a - b);
        expect(resoluciones).toEqual(ordenada);
    });

    it('cae en una resolución válida ante un zoom inservible', () => {
        expect(resolutionForZoom(undefined)).toBe(HEXBIN_RESOLUTION_BY_ZOOM[2].resolution);
        expect(resolutionForZoom(NaN)).toBe(HEXBIN_RESOLUTION_BY_ZOOM[2].resolution);
    });
});
