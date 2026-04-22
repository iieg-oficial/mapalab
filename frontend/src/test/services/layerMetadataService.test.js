import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockFindLayerById } = vi.hoisted(() => ({
    mockFindLayerById: vi.fn()
}));

vi.mock('@pages/maps/helpers/layers/utils/layerHelpers', () => ({
    findLayerById: mockFindLayerById
}));

const mockLayer = {
    id: 'capa-test',
    label: 'Capa Test',
    wmsConfig: {
        layerName: 'salud:hospitales',
        baseUrl: 'http://geo.test/geoserver/salud/wms'
    }
};

describe('layerMetadataService - sin API_HOST', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('getLayerMetadata retorna null', async () => {
        const { getLayerMetadata } = await import('@/services/layerMetadataService');
        expect(await getLayerMetadata('capa-test')).toBeNull();
    });

    it('getLayersSources retorna objeto vacío', async () => {
        const { getLayersSources } = await import('@/services/layerMetadataService');
        expect(await getLayersSources(['capa-test'])).toEqual({});
    });
});

describe('layerMetadataService - con API_HOST', () => {
    let getLayerMetadata, getLayersSources;

    beforeEach(async () => {
        vi.stubEnv('VITE_BACKEND_API_HOST', 'http://api.test');
        vi.resetModules();
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        const mod = await import('@/services/layerMetadataService');
        getLayerMetadata = mod.getLayerMetadata;
        getLayersSources = mod.getLayersSources;
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe('getLayerMetadata', () => {
        it('retorna null si no se encuentra la capa', async () => {
            mockFindLayerById.mockReturnValue(null);
            expect(await getLayerMetadata('no-existe')).toBeNull();
        });

        it('retorna datos limpios en fetch exitoso', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => [{ nombre: 'Hospitales', valor: '42' }]
            });

            const result = await getLayerMetadata('capa-test');
            expect(result.nombre).toBe('Hospitales');
            expect(result.valor).toBe('42');
        });

        it('limpia valores NaN a null', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => [{ nombre: 'Test', campo: 'NaN', nested: { valor: 'NaN' } }]
            });

            const result = await getLayerMetadata('capa-test');
            expect(result.campo).toBeNull();
            expect(result.nested.valor).toBeNull();
        });

        it('filtra numeralia con valor y nombre ambos nulos', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => [{
                    nombre: 'Test',
                    numeralia: [
                        { nombre: 'Total', valor: '100' },
                        { nombre: null, valor: null },
                        { nombre: 'Parcial', valor: null }
                    ]
                }]
            });

            const result = await getLayerMetadata('capa-test');
            expect(result.numeralia).toHaveLength(2);
            expect(result.numeralia.map(n => n.nombre)).not.toContain(null);
        });

        it('retorna null si la respuesta es array vacío', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            expect(await getLayerMetadata('capa-test')).toBeNull();
        });

        it('lanza error en respuesta HTTP no ok', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({ ok: false, status: 500 });

            await expect(getLayerMetadata('capa-test')).rejects.toThrow('Error HTTP: 500');
        });

        it('relanza AbortError en timeout', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            const abortError = new Error('aborted');
            abortError.name = 'AbortError';
            global.fetch.mockRejectedValue(abortError);

            await expect(getLayerMetadata('capa-test')).rejects.toMatchObject({ name: 'AbortError' });
        });
    });

    describe('getLayersSources', () => {
        it('retorna objeto vacío si ninguna capa tiene config WMS', async () => {
            mockFindLayerById.mockReturnValue(null);
            expect(await getLayersSources(['no-existe'])).toEqual({});
        });

        it('retorna mapa de fuentes con fetch exitoso', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => [
                    { nombre_capa_geoserver: 'salud:hospitales', fuentes_texto_corto: 'IMSS' }
                ]
            });

            const result = await getLayersSources(['capa-test']);
            expect(result['capa-test']).toBe('IMSS');
        });

        it('retorna null para capa sin fuente en la respuesta', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            const result = await getLayersSources(['capa-test']);
            expect(result['capa-test']).toBeNull();
        });

        it('deduplica capas con misma clave workspace:layer', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => [
                    { nombre_capa_geoserver: 'salud:hospitales', fuentes_texto_corto: 'IMSS' }
                ]
            });

            await getLayersSources(['capa-test', 'capa-test-duplicada']);
            const url = global.fetch.mock.calls[0][0];
            const params = new URL(url).searchParams.get('layers');
            expect(params.split(',').length).toBe(1);
        });

        it('lanza error en respuesta HTTP no ok', async () => {
            mockFindLayerById.mockReturnValue(mockLayer);
            global.fetch.mockResolvedValue({ ok: false, status: 404 });

            await expect(getLayersSources(['capa-test'])).rejects.toThrow('Error HTTP: 404');
        });
    });
});
