import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    MUNICIPIO_SOURCES,
    fetchMunicipiosList,
    fetchMunicipiosGeometries,
    clearMunicipioCache,
} from '@services/municipioService';

vi.mock('ol/format/GeoJSON', () => ({
    default: class MockGeoJSON {
        readFeatures(data) {
            return (data?.features || []).map(f => ({
                get: (k) => f.properties?.[k],
                getGeometry: () => f.geometry,
            }));
        }
    },
}));

describe('municipioService', () => {
    beforeEach(() => {
        clearMunicipioCache();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('MUNICIPIO_SOURCES', () => {
        it('expone las fuentes disponibles', () => {
            expect(MUNICIPIO_SOURCES).toEqual(['iieg', 'inegi']);
        });
    });

    describe('fetchMunicipiosList', () => {
        it('llama al endpoint /municipios/ del backend y normaliza items', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    items: [
                        { clave: '014', nombre: 'Guadalajara', region: 'Centro' },
                        { clave: '067', nombre: 'Zapopan', region: 'Centro' },
                    ],
                    count: 2,
                }),
            });
            const items = await fetchMunicipiosList();
            expect(items).toEqual([
                { clave: '014', nombre: 'Guadalajara', region: 'Centro' },
                { clave: '067', nombre: 'Zapopan', region: 'Centro' },
            ]);
            expect(global.fetch.mock.calls[0][0]).toContain('/municipios/');
        });

        it('cachea la lista entre llamadas', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ items: [{ clave: '001', nombre: 'A', region: null }] }),
            });
            await fetchMunicipiosList();
            await fetchMunicipiosList();
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('lanza error si el backend responde no-ok', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false, status: 503 });
            await expect(fetchMunicipiosList()).rejects.toThrow(/503/);
        });
    });

    describe('fetchMunicipiosGeometries', () => {
        it('retorna estructura vacía si no hay claves', async () => {
            const result = await fetchMunicipiosGeometries('iieg', []);
            expect(result).toEqual({ items: [], unionWkt: null, unionSrid: null, unionBbox: null });
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('pide al endpoint /municipios/geometries con source y claves, devuelve items + unionWkt + unionBbox', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    type: 'FeatureCollection',
                    source: 'iieg',
                    features: [
                        { properties: { clave: '014', nombre: 'Guadalajara' }, geometry: { type: 'Polygon' } },
                    ],
                    unionWkt: 'MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))',
                    unionSrid: 6368,
                    unionBbox: [0, 0, 1, 1],
                }),
            });
            const result = await fetchMunicipiosGeometries('iieg', ['014']);
            const url = global.fetch.mock.calls[0][0];
            const params = new URL(url, 'http://x').searchParams;
            expect(params.get('source')).toBe('iieg');
            expect(params.get('claves')).toBe('014');
            expect(result.items).toHaveLength(1);
            expect(result.items[0].clave).toBe('014');
            expect(result.unionWkt).toBe('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))');
            expect(result.unionSrid).toBe(6368);
            expect(result.unionBbox).toEqual([0, 0, 1, 1]);
        });

        it('ignora unionBbox inválido (no array o longitud distinta a 4)', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    features: [],
                    unionBbox: 'no-array',
                }),
            });
            const result = await fetchMunicipiosGeometries('iieg', ['014']);
            expect(result.unionBbox).toBeNull();
        });

        it('cachea por combinación source+claves', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ features: [{ properties: { clave: '014', nombre: 'X' }, geometry: {} }] }),
            });
            await fetchMunicipiosGeometries('iieg', ['014', '067']);
            await fetchMunicipiosGeometries('iieg', ['067', '014']);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('normaliza source inválido a iieg', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ features: [] }),
            });
            await fetchMunicipiosGeometries('invalido', ['014']);
            const params = new URL(global.fetch.mock.calls[0][0], 'http://x').searchParams;
            expect(params.get('source')).toBe('iieg');
        });
    });
});
