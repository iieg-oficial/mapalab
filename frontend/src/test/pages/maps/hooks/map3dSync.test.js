import { describe, it, expect, vi, beforeEach } from 'vitest';

const services = vi.hoisted(() => ({ count: vi.fn(), fetch: vi.fn() }));

vi.mock('@services/vectorLayerService', () => ({
    VECTOR_PROJECTION: 'EPSG:3857',
    countVectorFeatures: services.count,
    fetchVectorFeatures: services.fetch,
}));

import { syncWmsLayers } from '@pages/maps/hooks/useMap3dLayers';
import { loadExtrusion } from '@pages/maps/hooks/useMap3dExtrusions';

const URL_WMS = 'https://iieg.test/sextante/demografia/wms';

const fakeOlLayer = ({ uid, zIndex, opacity = 1, visible = true, params, teselada = false }) => {
    const source = teselada
        ? { getUrls: () => [URL_WMS], getParams: () => params }
        : { getUrl: () => URL_WMS, getParams: () => params };
    return {
        ol_uid: uid,
        get: (key) => (key === 'mergedLayers' ? [{}] : undefined),
        getVisible: () => visible,
        getZIndex: () => zIndex,
        getOpacity: () => opacity,
        getSource: () => source,
    };
};

const fakeOlMap = (layers) => ({ getLayers: () => ({ getArray: () => layers }) });

const fakeMaplibre = () => {
    const sources = new Map();
    const order = ['fondo', 'base', 'sombreado'];
    return {
        sources,
        order,
        getStyle: () => ({ layers: order.map(id => ({ id })) }),
        getLayer: (id) => (order.includes(id) ? { id } : undefined),
        getSource: (id) => sources.get(id),
        addSource: (id, spec) => sources.set(id, { ...spec, setTiles: vi.fn(function setTiles(tiles) { this.tiles = tiles; }) }),
        removeSource: (id) => sources.delete(id),
        addLayer: vi.fn((spec, before) => order.splice(before ? order.indexOf(before) : order.length, 0, spec.id)),
        removeLayer: (id) => order.splice(order.indexOf(id), 1),
        moveLayer: (id, before) => {
            order.splice(order.indexOf(id), 1);
            order.splice(before ? order.indexOf(before) : order.length, 0, id);
        },
        setPaintProperty: vi.fn(),
    };
};

describe('syncWmsLayers', () => {
    it('refleja las capas WMS visibles bajo el sombreado en el orden de OpenLayers', () => {
        const map = fakeMaplibre();
        const alta = fakeOlLayer({ uid: 2, zIndex: 102, params: { LAYERS: 'a:dos' } });
        const baja = fakeOlLayer({ uid: 1, zIndex: 101, opacity: 0.6, params: { LAYERS: 'a:uno' } });
        const oculta = fakeOlLayer({ uid: 3, zIndex: 103, visible: false, params: { LAYERS: 'a:tres' } });
        syncWmsLayers(map, fakeOlMap([alta, baja, oculta]));
        expect(map.order).toEqual(['fondo', 'base', 'wms-1', 'wms-2', 'sombreado']);
        expect(map.addLayer.mock.calls.find(([spec]) => spec.id === 'wms-1')[0].paint['raster-opacity']).toBe(0.6);
        expect(map.sources.get('wms-1').tiles[0]).toContain('LAYERS=a%3Auno');
    });

    it('tambien refleja las capas teseladas, que exponen getUrls en plural', () => {
        const map = fakeMaplibre();
        const teselada = fakeOlLayer({ uid: 9, zIndex: 101, teselada: true, params: { LAYERS: 'economia:cultivos', TILED: true } });
        syncWmsLayers(map, fakeOlMap([teselada]));
        expect(map.order).toContain('wms-9');
        expect(map.sources.get('wms-9').tiles[0]).toContain('LAYERS=economia%3Acultivos');
        expect(map.sources.get('wms-9').tiles[0]).not.toContain('TILED');
    });

    it('actualiza el filtro sin recrear la fuente y quita las capas que salen', () => {
        const map = fakeMaplibre();
        const params = { LAYERS: 'a:uno', CQL_FILTER: "fecha='2024-01-01'" };
        const capa = fakeOlLayer({ uid: 1, zIndex: 101, params });
        syncWmsLayers(map, fakeOlMap([capa]));
        const source = map.sources.get('wms-1');
        params.CQL_FILTER = "fecha='2025-01-01'";
        syncWmsLayers(map, fakeOlMap([capa]));
        expect(source.setTiles).toHaveBeenCalledTimes(1);
        expect(source.tiles[0]).toContain('2025-01-01');
        syncWmsLayers(map, fakeOlMap([]));
        expect(map.order).toEqual(['fondo', 'base', 'sombreado']);
        expect(map.sources.has('wms-1')).toBe(false);
    });
});

describe('loadExtrusion', () => {
    const wmsConfig = { baseUrl: '/sextante/demografia/wms', layerName: 'demografia:poblacion' };
    const feature = (valor) => ({
        type: 'Feature',
        properties: { nombre: 'X', poblacion_total: valor },
        geometry: { type: 'Point', coordinates: [-11503000, 2350000] },
    });
    const legend = {
        Legend: [{ rules: [
            { filter: "[poblacion_total >= '0' AND poblacion_total < '100']", symbolizers: [{ Polygon: { fill: '#aaaaaa' } }] },
            { filter: "[poblacion_total >= '100']", symbolizers: [{ Polygon: { fill: '#111111' } }] },
        ] }],
    };

    beforeEach(() => {
        services.count.mockReset();
        services.fetch.mockReset();
    });

    it('usa los cortes y colores del SLD y el maximo del campo', async () => {
        services.count.mockResolvedValue(2);
        services.fetch.mockResolvedValue({ type: 'FeatureCollection', features: [feature(50), feature(250)] });
        const getLegendJson = vi.fn().mockResolvedValue(legend);
        const result = await loadExtrusion({ wmsConfig, cqlFilter: "fecha='2025-01-01'", getLegendJson, layerId: 'poblacion' });
        expect(services.fetch).toHaveBeenCalledWith(wmsConfig, "fecha='2025-01-01'", undefined);
        expect(getLegendJson).toHaveBeenCalledWith({ id: 'poblacion' });
        expect(result.status).toBe('ready');
        expect(result.style.property).toBe('poblacion_total');
        expect(result.style.maxValue).toBe(250);
        expect(result.style.color[3]).toEqual(['step', ['to-number', ['get', 'poblacion_total'], Number.NaN], '#aaaaaa', 100, '#111111']);
        expect(result.collection.features[0].geometry.coordinates[0]).toBeLessThan(-100);
    });

    it('sin leyenda usable colorea por cuantiles', async () => {
        services.count.mockResolvedValue(2);
        services.fetch.mockResolvedValue({ type: 'FeatureCollection', features: [feature(1), feature(9)] });
        const result = await loadExtrusion({ wmsConfig, cqlFilter: null, getLegendJson: async () => null, layerId: 'poblacion' });
        expect(result.status).toBe('ready');
        expect(result.style.property).toBe('poblacion_total');
    });

    it('no descarga capas demasiado grandes', async () => {
        services.count.mockResolvedValue(50000);
        const result = await loadExtrusion({ wmsConfig, cqlFilter: null, getLegendJson: vi.fn(), layerId: 'x' });
        expect(result.status).toBe('too_large');
        expect(services.fetch).not.toHaveBeenCalled();
    });

    it('reporta capas sin campo numerico', async () => {
        services.count.mockResolvedValue(1);
        services.fetch.mockResolvedValue({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { nombre: 'X' }, geometry: null }] });
        const result = await loadExtrusion({ wmsConfig, cqlFilter: null, getLegendJson: async () => null, layerId: 'x' });
        expect(result.status).toBe('no_value');
    });
});
