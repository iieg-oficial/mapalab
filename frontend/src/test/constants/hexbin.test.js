import { describe, it, expect } from 'vitest';
import { resolutionForZoom, HEXBIN_RESOLUTION_BY_ZOOM, HEXBIN_MAX_RESOLUTION } from '@constants/hexbin';

describe('resolutionForZoom', () => {
    it('da celdas grandes cuando se ve todo el estado', () => {
        expect(resolutionForZoom(5)).toBe(4);
        expect(resolutionForZoom(8)).toBe(5);
    });

    it('afina al acercarse', () => {
        expect(resolutionForZoom(12)).toBe(8);
        expect(resolutionForZoom(15)).toBe(9);
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
        expect(resolutionForZoom(undefined)).toBe(HEXBIN_RESOLUTION_BY_ZOOM[1].resolution);
        expect(resolutionForZoom(NaN)).toBe(HEXBIN_RESOLUTION_BY_ZOOM[1].resolution);
    });
});
