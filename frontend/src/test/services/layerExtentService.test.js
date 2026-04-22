import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLayerExtent, clearExtentCache } from '@services/layerExtentService';

const buildLayer = (overrides = {}) => ({
    id: 'layer-a',
    wmsConfig: {
        baseUrl: '/geoserver/recursos_y_calidad_de_vida/wms',
        layerName: 'recursos_y_calidad_de_vida:area_de_proteccion_bosque_la_primavera',
        cqlFilter: '',
        ...overrides
    }
});

const buildFeatureCollection = () => ({
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-11520000, 2340000] },
            properties: {}
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-11500000, 2360000] },
            properties: {}
        }
    ]
});

const mockFetchResponse = (data, { ok = true, contentType = 'application/json' } = {}) => ({
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Internal Server Error',
    headers: { get: (h) => (h === 'content-type' ? contentType : null) },
    json: async () => data,
    text: async () => JSON.stringify(data)
});

beforeEach(() => {
    clearExtentCache();
    global.fetch = vi.fn();
});

describe('fetchLayerExtent', () => {
    it('retorna null si no hay wmsConfig', async () => {
        expect(await fetchLayerExtent(null)).toBeNull();
        expect(await fetchLayerExtent({})).toBeNull();
        expect(await fetchLayerExtent({ wmsConfig: {} })).toBeNull();
    });

    it('llama WFS GetFeature con los params correctos', async () => {
        global.fetch.mockResolvedValue(mockFetchResponse(buildFeatureCollection()));

        await fetchLayerExtent(buildLayer());

        const calledUrl = global.fetch.mock.calls[0][0];
        expect(calledUrl).toContain('/geoserver/recursos_y_calidad_de_vida/wfs');
        expect(calledUrl).toContain('SERVICE=WFS');
        expect(calledUrl).toContain('REQUEST=GetFeature');
        expect(calledUrl).toContain('OUTPUTFORMAT=application%2Fjson');
        expect(calledUrl).toContain('SRSNAME=EPSG%3A3857');
    });

    it('incluye CQL_FILTER si el layer lo tiene', async () => {
        global.fetch.mockResolvedValue(mockFetchResponse(buildFeatureCollection()));

        await fetchLayerExtent(buildLayer({ cqlFilter: "estatus = 'activo'" }));

        const calledUrl = global.fetch.mock.calls[0][0];
        expect(calledUrl).toContain('CQL_FILTER=');
    });

    it('retorna extent computado de las features', async () => {
        global.fetch.mockResolvedValue(mockFetchResponse(buildFeatureCollection()));

        const extent = await fetchLayerExtent(buildLayer());

        expect(extent).toEqual([-11520000, 2340000, -11500000, 2360000]);
    });

    it('retorna null si la respuesta no tiene features', async () => {
        global.fetch.mockResolvedValue(mockFetchResponse({ type: 'FeatureCollection', features: [] }));

        const extent = await fetchLayerExtent(buildLayer());
        expect(extent).toBeNull();
    });

    it('retorna null si fetch falla', async () => {
        global.fetch.mockRejectedValue(new Error('timeout'));

        const extent = await fetchLayerExtent(buildLayer());
        expect(extent).toBeNull();
    });

    it('cachea el resultado por layer + cqlFilter', async () => {
        global.fetch.mockResolvedValue(mockFetchResponse(buildFeatureCollection()));

        await fetchLayerExtent(buildLayer());
        await fetchLayerExtent(buildLayer());

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('clearExtentCache permite refetchar', async () => {
        global.fetch.mockResolvedValue(mockFetchResponse(buildFeatureCollection()));

        await fetchLayerExtent(buildLayer());
        clearExtentCache();
        await fetchLayerExtent(buildLayer());

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
