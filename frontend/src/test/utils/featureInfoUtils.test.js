import { describe, it, expect } from 'vitest';
import {
    combineCQLFilters,
    getWmsUrl,
    getWfsUrl,
    filterValidLayers,
    groupLayersByUrl,
    parseResponse
} from '@/utils/featureInfoUtils';

describe('combineCQLFilters', () => {
    it('retorna null si ambos son nulos', () => {
        expect(combineCQLFilters(null, null)).toBeNull();
    });

    it('retorna el filtro base si el dinámico es nulo', () => {
        expect(combineCQLFilters('municipio=\'GDL\'', null)).toBe('municipio=\'GDL\'');
    });

    it('retorna el filtro dinámico si el base es nulo', () => {
        expect(combineCQLFilters(null, 'tipo=\'A\'')).toBe('tipo=\'A\'');
    });

    it('combina ambos filtros con AND', () => {
        expect(combineCQLFilters('municipio=\'GDL\'', 'tipo=\'A\'')).toBe(
            '(municipio=\'GDL\') AND (tipo=\'A\')'
        );
    });
});

describe('getWmsUrl / getWfsUrl', () => {
    it('getWmsUrl convierte /wfs a /wms', () => {
        expect(getWmsUrl('http://geo.server.com/geoserver/wfs')).toBe(
            'http://geo.server.com/geoserver/wms'
        );
    });

    it('getWmsUrl no modifica una URL que ya es /wms', () => {
        expect(getWmsUrl('http://geo.server.com/geoserver/wms')).toBe(
            'http://geo.server.com/geoserver/wms'
        );
    });

    it('getWfsUrl convierte /wms a /wfs', () => {
        expect(getWfsUrl('http://geo.server.com/geoserver/wms')).toBe(
            'http://geo.server.com/geoserver/wfs'
        );
    });

    it('getWfsUrl no modifica una URL que ya es /wfs', () => {
        expect(getWfsUrl('http://geo.server.com/geoserver/wfs')).toBe(
            'http://geo.server.com/geoserver/wfs'
        );
    });
});

describe('filterValidLayers', () => {
    const mockFindWMSConfig = (layerId) => {
        const configs = {
            'general-layer': { workspace: 'general', baseUrl: 'http://server/wms', layerName: 'general:layer' },
            'tematic-layer': { workspace: 'recursos', baseUrl: 'http://server/wms', layerName: 'recursos:layer' },
            'another-tematic': { workspace: 'general2', baseUrl: 'http://server/wms', layerName: 'general2:layer' },
        };
        return configs[layerId] || null;
    };

    const mockLayers = [];

    it('filtra capas no visibles', () => {
        const activeLayers = [
            { id: 'tematic-layer', visible: false },
            { id: 'another-tematic', visible: true },
        ];
        const result = filterValidLayers(activeLayers, mockLayers, mockFindWMSConfig);
        expect(result).toHaveLength(1);
        expect(result[0].layer.id).toBe('another-tematic');
    });

    it('filtra capas sin wmsConfig', () => {
        const activeLayers = [
            { id: 'non-existent', visible: true },
            { id: 'tematic-layer', visible: true },
        ];
        const result = filterValidLayers(activeLayers, mockLayers, mockFindWMSConfig);
        expect(result).toHaveLength(1);
        expect(result[0].layer.id).toBe('tematic-layer');
    });

    it('excluye capas general cuando hay capas temáticas', () => {
        const activeLayers = [
            { id: 'general-layer', visible: true },
            { id: 'tematic-layer', visible: true },
        ];
        const result = filterValidLayers(activeLayers, mockLayers, mockFindWMSConfig);
        expect(result).toHaveLength(1);
        expect(result[0].layer.id).toBe('tematic-layer');
    });

    it('incluye capas general si no hay temáticas', () => {
        const activeLayers = [
            { id: 'general-layer', visible: true },
        ];
        const result = filterValidLayers(activeLayers, mockLayers, mockFindWMSConfig);
        expect(result).toHaveLength(1);
        expect(result[0].layer.id).toBe('general-layer');
    });

    it('retorna vacío si no hay capas activas', () => {
        expect(filterValidLayers([], mockLayers, mockFindWMSConfig)).toHaveLength(0);
    });

    it('deduplica capas con el mismo id', () => {
        const activeLayers = [
            { id: 'tematic-layer', visible: true },
            { id: 'tematic-layer', visible: true },
            { id: 'another-tematic', visible: true },
        ];
        const result = filterValidLayers(activeLayers, mockLayers, mockFindWMSConfig);
        expect(result).toHaveLength(2);
        expect(result[0].layer.id).toBe('tematic-layer');
        expect(result[1].layer.id).toBe('another-tematic');
    });
});

describe('groupLayersByUrl', () => {
    it('agrupa capas por URL normalizada', () => {
        const validLayers = [
            {
                layer: { id: 'layer1' },
                wmsConfig: { baseUrl: 'http://server/wms', layerName: 'ws:layer1' }
            },
            {
                layer: { id: 'layer2' },
                wmsConfig: { baseUrl: 'http://server/wms', layerName: 'ws:layer2' }
            },
        ];
        const result = groupLayersByUrl(validLayers, url => url);
        expect(Object.keys(result)).toHaveLength(1);
        expect(Object.keys(result['http://server/wms'])).toHaveLength(2);
    });

    it('separa capas de diferentes URLs', () => {
        const validLayers = [
            {
                layer: { id: 'layer1' },
                wmsConfig: { baseUrl: 'http://server-a/wms', layerName: 'ws:layer1' }
            },
            {
                layer: { id: 'layer2' },
                wmsConfig: { baseUrl: 'http://server-b/wms', layerName: 'ws:layer2' }
            },
        ];
        const result = groupLayersByUrl(validLayers, url => url);
        expect(Object.keys(result)).toHaveLength(2);
    });

    it('agrupa múltiples capas con mismo layerName bajo mismo array', () => {
        const validLayers = [
            {
                layer: { id: 'layer1a' },
                wmsConfig: { baseUrl: 'http://server/wms', layerName: 'ws:shared' }
            },
            {
                layer: { id: 'layer1b' },
                wmsConfig: { baseUrl: 'http://server/wms', layerName: 'ws:shared' }
            },
        ];
        const result = groupLayersByUrl(validLayers, url => url);
        expect(result['http://server/wms']['ws:shared']).toHaveLength(2);
    });
});

describe('parseResponse', () => {
    const makeResponse = (body, contentType, ok = true, status = 200) => ({
        ok,
        status,
        headers: { get: (key) => key === 'content-type' ? contentType : null },
        json: async () => JSON.parse(body),
        text: async () => body
    });

    it('parsea JSON correctamente', async () => {
        const response = makeResponse('{"features":[]}', 'application/json');
        const result = await parseResponse(response);
        expect(result).toEqual({ features: [] });
    });

    it('parsea text/plain con JSON válido', async () => {
        const response = makeResponse('{"features":[]}', 'text/plain');
        const result = await parseResponse(response);
        expect(result).toEqual({ features: [] });
    });

    it('retorna null para text/plain con JSON inválido', async () => {
        const response = makeResponse('not json', 'text/plain');
        const result = await parseResponse(response);
        expect(result).toBeNull();
    });

    it('retorna null para content-type no soportado', async () => {
        const response = makeResponse('<xml/>', 'application/xml');
        const result = await parseResponse(response);
        expect(result).toBeNull();
    });

    it('lanza error si response.ok es false', async () => {
        const response = makeResponse('error', 'application/json', false, 500);
        await expect(parseResponse(response)).rejects.toThrow('HTTP error! status: 500');
    });
});
