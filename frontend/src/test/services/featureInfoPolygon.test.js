import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Polygon from 'ol/geom/Polygon';

import { getFeaturesInPolygonForActiveLayers, POLYGON_PAGE_SIZE } from '@services/featureInfoService';

vi.mock('@utils/featureInfoUtils', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        fetchGeometryColumns: vi.fn(async () => ({ 'seguridad:delitos': 'geom' }))
    };
});

vi.mock('@pages/maps/helpers/wmsConfig', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        findWMSConfig: vi.fn(() => ({
            baseUrl: 'https://sextante.test/seguridad/wfs',
            layerName: 'seguridad:delitos',
            workspace: 'seguridad',
            wfsAvailable: true,
            cqlFilter: null
        }))
    };
});

const map = {
    getView: () => ({ getProjection: () => ({ getCode: () => 'EPSG:3857' }) })
};

const polygonGeometry = new Polygon([[[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]]);
const activeLayers = [{ id: 'delitos', name: 'Delitos', visible: true }];

const jsonResponse = (body) => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => body
});

const buildBody = (count, matched) => ({
    type: 'FeatureCollection',
    features: Array.from({ length: count }, (_, i) => ({ id: `delitos.${i}`, properties: {} })),
    numberMatched: matched,
    numberReturned: count
});

const paramsOf = (url) => new URLSearchParams(url.split('?')[1]);

describe('getFeaturesInPolygonForActiveLayers', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('omite STARTINDEX en la primera pagina', async () => {
        global.fetch.mockResolvedValue(jsonResponse(buildBody(POLYGON_PAGE_SIZE, 88702)));

        const page = await getFeaturesInPolygonForActiveLayers(activeLayers, map, polygonGeometry);

        const params = paramsOf(global.fetch.mock.calls[0][0]);
        expect(params.has('STARTINDEX')).toBe(false);
        expect(params.get('COUNT')).toBe(String(POLYGON_PAGE_SIZE));
        expect(page.nextIndex).toBe(POLYGON_PAGE_SIZE);
        expect(page.hasMore).toBe(true);
    });

    it('pide lo que queda dentro del polígono y no el rectángulo que lo envuelve', async () => {
        global.fetch.mockResolvedValue(jsonResponse(buildBody(3, 3)));

        await getFeaturesInPolygonForActiveLayers(activeLayers, map, polygonGeometry);

        const cql = paramsOf(global.fetch.mock.calls[0][0]).get('CQL_FILTER');
        expect(cql).toBe('WITHIN(geom, SRID=3857;POLYGON((-1 -1,1 -1,1 1,-1 1,-1 -1)))');
        expect(cql).not.toContain('BBOX');
    });

    it('manda STARTINDEX solo al pedir una pagina posterior', async () => {
        global.fetch.mockResolvedValue(jsonResponse(buildBody(85, 285)));

        await getFeaturesInPolygonForActiveLayers(activeLayers, map, polygonGeometry, null, false, [], { startIndex: 200 });

        const params = paramsOf(global.fetch.mock.calls[0][0]);
        expect(params.get('STARTINDEX')).toBe('200');
    });

    it('reporta hasMore falso cuando el servidor rechaza la peticion', async () => {
        global.fetch.mockResolvedValue({ ok: false, status: 400, headers: { get: () => 'text/xml' } });

        const page = await getFeaturesInPolygonForActiveLayers(activeLayers, map, polygonGeometry);

        expect(page.results).toEqual([]);
        expect(page.hasMore).toBe(false);
    });
});
