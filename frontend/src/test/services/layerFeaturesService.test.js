import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLayerFeaturesInBbox, isRasterWorkspace, FEATURE_CAP } from '@services/layerFeaturesService';

const okResponse = (json) => ({ ok: true, json: async () => json });

describe('layerFeaturesService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('isRasterWorkspace detecta workspaces raster conocidos', () => {
        expect(isRasterWorkspace('raster')).toBe(true);
        expect(isRasterWorkspace('lluvia')).toBe(true);
        expect(isRasterWorkspace('temperatura')).toBe(true);
        expect(isRasterWorkspace('salud')).toBe(false);
    });

    it('retorna null si wmsConfig no tiene baseUrl o bbox es invalido', async () => {
        expect(await fetchLayerFeaturesInBbox(null, [0, 0, 1, 1])).toBeNull();
        expect(await fetchLayerFeaturesInBbox({ baseUrl: 'x' }, null)).toBeNull();
        expect(await fetchLayerFeaturesInBbox({ baseUrl: 'x' }, [0, 0])).toBeNull();
    });

    it('retorna null si wfsAvailable=false', async () => {
        const res = await fetchLayerFeaturesInBbox(
            { baseUrl: 'http://gs/a/wms', layerName: 'a:x', wfsAvailable: false },
            [0, 0, 1, 1],
        );
        expect(res).toBeNull();
    });

    it('retorna null para workspace raster', async () => {
        const res = await fetchLayerFeaturesInBbox(
            { baseUrl: 'http://gs/raster/wms', layerName: 'raster:t', workspace: 'raster' },
            [0, 0, 1, 1],
        );
        expect(res).toBeNull();
    });

    it('retorna FeatureCollection cuando features <= cap', async () => {
        const fc = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: null }] };
        vi.spyOn(global, 'fetch').mockResolvedValue(okResponse(fc));
        const res = await fetchLayerFeaturesInBbox(
            { baseUrl: 'http://gs/salud/wms', layerName: 'salud:hospitales', workspace: 'salud' },
            [0, 0, 100, 100],
        );
        expect(res).toEqual(fc);
    });

    it('retorna null cuando features supera el cap (capa demasiado densa)', async () => {
        const tooMany = Array.from({ length: FEATURE_CAP + 5 }, () => ({ type: 'Feature', geometry: null }));
        vi.spyOn(global, 'fetch').mockResolvedValue(okResponse({ type: 'FeatureCollection', features: tooMany }));
        const res = await fetchLayerFeaturesInBbox(
            { baseUrl: 'http://gs/predios/wms', layerName: 'predios:lotes', workspace: 'predios' },
            [0, 0, 100, 100],
        );
        expect(res).toBeNull();
    });

    it('inyecta cqlFilter cuando wmsConfig lo trae', async () => {
        vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
            expect(String(url)).toContain('CQL_FILTER=anio%3D2024');
            return okResponse({ type: 'FeatureCollection', features: [] });
        });
        await fetchLayerFeaturesInBbox(
            { baseUrl: 'http://gs/eco/wms', layerName: 'eco:gdp', workspace: 'eco', cqlFilter: 'anio=2024' },
            [0, 0, 100, 100],
        );
    });

    it('retorna null si fetch falla', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 });
        const res = await fetchLayerFeaturesInBbox(
            { baseUrl: 'http://gs/salud/wms', layerName: 'salud:x', workspace: 'salud' },
            [0, 0, 100, 100],
        );
        expect(res).toBeNull();
    });
});
