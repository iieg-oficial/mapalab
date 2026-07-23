import { describe, it, expect } from 'vitest';
import { fromLonLat } from 'ol/proj';
import { RELIEF_OVERLAY } from './basemaps';

const paramsOf = (url) => {
    const search = new URLSearchParams(url.slice(url.indexOf('?') + 1));
    const lower = {};
    search.forEach((value, key) => {
        lower[key.toLowerCase()] = value;
    });
    return lower;
};

const tileUrlFor = (source, lon, lat, z) => {
    const tileCoord = source.getTileGrid().getTileCoordForCoordAndZ(fromLonLat([lon, lat]), z);
    return source.getTileUrlFunction()(tileCoord, 1, source.getProjection());
};

describe('relieve servido por GeoWebCache', () => {
    it('alinea el grid con el gridset EPSG:900913 de GWC', () => {
        const url = tileUrlFor(RELIEF_OVERLAY.iieg(), -103.35, 20.67, 10);
        const params = paramsOf(url);

        expect(url).toContain('/gwc/service/wmts');
        expect(params.service).toBe('WMTS');
        expect(params.request).toBe('GetTile');
        expect(params.tilematrixset).toBe('EPSG:900913');
        expect(params.tilematrix).toBe('EPSG:900913:10');
        expect(params.format).toBe('image/png');
        expect(params.tilecol).toBe('218');
        expect(params.tilerow).toBe('451');
    });

    it('resuelve las dos variantes de relieve', () => {
        expect(RELIEF_OVERLAY.iieg().getLayer()).toBe('raster:hillshade_iieg_cog');
        expect(RELIEF_OVERLAY.inegi().getLayer()).toBe('raster:hillshade_inegi_cog');
    });

    it('no pide tiles fuera del area de la capa', () => {
        const range = RELIEF_OVERLAY.iieg().getTileGrid().getFullTileRange(8);

        expect([range.minX, range.maxX]).toEqual([52, 55]);
        expect([range.minY, range.maxY]).toEqual([111, 114]);
    });
});
