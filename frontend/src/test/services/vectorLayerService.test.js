import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildVectorWFSUrl, countVectorFeatures } from '@services/vectorLayerService';

const wmsConfig = {
    baseUrl: 'http://geo.test/geoserver/salud/wms',
    layerName: 'salud:unidades_salud'
};

describe('buildVectorWFSUrl', () => {
    it('apunta al endpoint WFS del workspace', () => {
        const url = new URL(buildVectorWFSUrl(wmsConfig, ''));
        expect(url.origin + url.pathname).toBe('http://geo.test/geoserver/salud/wfs');
    });

    it('pide GeoJSON en la proyección del mapa', () => {
        const url = new URL(buildVectorWFSUrl(wmsConfig, ''));
        expect(url.searchParams.get('outputFormat')).toBe('application/json');
        expect(url.searchParams.get('srsName')).toBe('EPSG:3857');
        expect(url.searchParams.get('typeNames')).toBe('salud:unidades_salud');
    });

    it('prefiere wfsLayerName sobre layerName', () => {
        const url = new URL(buildVectorWFSUrl({ ...wmsConfig, wfsLayerName: 'salud:otra' }, ''));
        expect(url.searchParams.get('typeNames')).toBe('salud:otra');
    });

    it('omite CQL_FILTER cuando no hay filtro', () => {
        const url = new URL(buildVectorWFSUrl(wmsConfig, ''));
        expect(url.searchParams.has('CQL_FILTER')).toBe(false);
    });

    it('manda el filtro tal cual se le pasa, sin duplicar el base', () => {
        const url = new URL(buildVectorWFSUrl({ ...wmsConfig, cqlFilter: "tipo = 'A'" }, "tipo = 'A'"));
        expect(url.searchParams.getAll('CQL_FILTER')).toEqual(["tipo = 'A'"]);
    });
});

describe('countVectorFeatures', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const respondWith = (body) => {
        global.fetch.mockResolvedValue({
            ok: true,
            headers: { get: () => 'application/json' },
            text: async () => body
        });
    };

    const HITS_XML = '<?xml version="1.0" encoding="UTF-8"?><wfs:FeatureCollection'
        + ' numberMatched="110215" numberReturned="0" xmlns:wfs="http://www.opengis.net/wfs/2.0"/>';

    it('pide resultType=hits', async () => {
        respondWith(HITS_XML);
        await countVectorFeatures(wmsConfig, '');
        const url = new URL(global.fetch.mock.calls[0][0]);
        expect(url.searchParams.get('resultType')).toBe('hits');
    });

    it('lee el numberMatched del XML, que es lo que responde GeoServer a un hits', async () => {
        respondWith(HITS_XML);
        expect(await countVectorFeatures(wmsConfig, '')).toBe(110215);
    });

    it('acepta también el numberMatched en JSON', async () => {
        respondWith(JSON.stringify({ numberMatched: 4218 }));
        expect(await countVectorFeatures(wmsConfig, '')).toBe(4218);
    });

    it('devuelve null cuando el servidor no reporta el total', async () => {
        respondWith(JSON.stringify({ features: [] }));
        expect(await countVectorFeatures(wmsConfig, '')).toBe(null);
    });

    it('propaga el error HTTP en vez de dar por bueno el conteo', async () => {
        global.fetch.mockResolvedValue({ ok: false, status: 500, text: async () => '' });
        await expect(countVectorFeatures(wmsConfig, '')).rejects.toThrow('500');
    });
});
