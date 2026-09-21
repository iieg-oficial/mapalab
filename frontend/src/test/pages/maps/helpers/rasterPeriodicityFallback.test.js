import { describe, it, expect, vi } from 'vitest';
import {
    fillRasterPeriodicity,
    needsRasterPeriodicity,
} from '@pages/maps/helpers/layers/utils/rasterPeriodicityFallback';

const WMS = { baseUrl: 'https://x/sextante/raster/wms', layerName: 'raster:nddi', timeEnabled: true };
const PERIODICIDAD = { 2025: { 1: '2025-01-01', 2: '2025-02-01' } };

const raster = (id, extra = {}) => ({ id, wmsConfig: WMS, geometryType: 'raster', ...extra });

describe('needsRasterPeriodicity', () => {
    it('pide fechas a un raster con TIME y sin periodicidad en el catalogo', () => {
        expect(needsRasterPeriodicity(raster('nddi'))).toBe(true);
    });

    it('tambien a uno sin tipo de geometria capturado', () => {
        expect(needsRasterPeriodicity(raster('nddi', { geometryType: null }))).toBe(true);
    });

    it('respeta la periodicidad capturada en el catalogo', () => {
        expect(needsRasterPeriodicity(raster('lluvia', { rasterPeriodicity: PERIODICIDAD }))).toBe(false);
    });

    it('no toca capas sin TIME', () => {
        expect(needsRasterPeriodicity(raster('dem', { wmsConfig: { ...WMS, timeEnabled: false } }))).toBe(false);
    });

    it('lee timeEnabled dentro de wmsConfig, que es donde lo pone el arbol', () => {
        expect(needsRasterPeriodicity({ id: 'nddi', timeEnabled: true, wmsConfig: { ...WMS, timeEnabled: false } })).toBe(false);
    });

    it('no toca vectoriales aunque tengan TIME', () => {
        expect(needsRasterPeriodicity(raster('puntos', { geometryType: 'point' }))).toBe(false);
    });
});

describe('fillRasterPeriodicity', () => {
    it('completa la capa anidada con lo que anuncia GeoServer', async () => {
        const tree = [{ id: 'clima', children: [raster('nddi')] }];
        const fetch = vi.fn().mockResolvedValue(PERIODICIDAD);
        const filled = await fillRasterPeriodicity(tree, fetch);
        expect(fetch).toHaveBeenCalledWith(WMS);
        expect(filled[0].children[0].rasterPeriodicity).toEqual(PERIODICIDAD);
    });

    it('devuelve el mismo arbol si no hay nada que completar', async () => {
        const tree = [{ id: 'base', children: [raster('dem', { wmsConfig: { ...WMS, timeEnabled: false } })] }];
        const fetch = vi.fn();
        expect(await fillRasterPeriodicity(tree, fetch)).toBe(tree);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('conserva las ramas que no cambian', async () => {
        const quieta = { id: 'vector', children: [{ id: 'municipios' }] };
        const tree = [quieta, { id: 'clima', children: [raster('nddi')] }];
        const filled = await fillRasterPeriodicity(tree, vi.fn().mockResolvedValue(PERIODICIDAD));
        expect(filled[0]).toBe(quieta);
    });

    it('si GeoServer no responde deja el arbol como estaba', async () => {
        const tree = [raster('nddi')];
        const filled = await fillRasterPeriodicity(tree, vi.fn().mockRejectedValue(new Error('caido')));
        expect(filled).toBe(tree);
    });
});
