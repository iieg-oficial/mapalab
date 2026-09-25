import { describe, it, expect } from 'vitest';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import {
    buildBaseStyle,
    cameraToOlView,
    canExtrudeLayer,
    cieloSpec,
    clampExaggeration,
    clampPitch,
    cqlSegmentFor,
    olViewToCamera,
    RELIEF_LAYER_ID,
    reliefSourceSpec,
    terrainSourceSpec,
    wmsTileUrl,
} from '@pages/maps/helpers/view3d';

const poligono = (overrides = {}) => ({
    id: 'poblacion',
    geometryType: 'polygon',
    wmsConfig: { workspace: 'demografia', wfsAvailable: true, layerName: 'demografia:poblacion' },
    ...overrides,
});

describe('camara entre OpenLayers y MapLibre', () => {
    it('baja un nivel de zoom al pasar a MapLibre y lo sube de regreso', () => {
        const view = new View({ center: fromLonLat([-103.35, 20.67]), zoom: 9 });
        const camera = olViewToCamera(view);
        expect(camera.zoom).toBe(8);
        expect(camera.center[0]).toBeCloseTo(-103.35, 6);
        expect(camera.center[1]).toBeCloseTo(20.67, 6);
        const back = cameraToOlView(camera);
        expect(back.zoom).toBe(9);
        expect(back.center[0]).toBeCloseTo(view.getCenter()[0], 3);
    });

    it('sin vista cae en el encuadre de Jalisco', () => {
        expect(olViewToCamera(null).center).toEqual([-103.585, 20.85]);
    });
});

describe('limites de los controles', () => {
    it('acota inclinacion y exageracion', () => {
        expect(clampPitch(120)).toBe(80);
        expect(clampPitch(-5)).toBe(0);
        expect(clampExaggeration(9)).toBe(5);
        expect(clampExaggeration('x')).toBe(1);
    });
});

describe('fuente de terreno', () => {
    it('decodifica la altura como R*256+G desde el WMTS de GWC', () => {
        const spec = terrainSourceSpec();
        expect(spec).toMatchObject({ type: 'raster-dem', encoding: 'custom', redFactor: 256, greenFactor: 1, blueFactor: 0, baseShift: 0 });
        expect(spec.tiles[0]).toContain('LAYER=raster%3Aelevacion_terreno_rgb');
        expect(spec.tiles[0]).toContain('TILEMATRIX=EPSG:900913:{z}&TILEROW={y}&TILECOL={x}');
        expect(spec.bounds).toEqual([-107.56, 17.14, -99.69, 24.45]);
        expect(spec.tiles[0]).toMatch(/&dem=contexto-2$/);
    });

    it('sombrea solo con el DEM de Jalisco, así que fuera del estado no hay relieve dibujado', () => {
        const spec = reliefSourceSpec();
        expect(spec).toMatchObject({ type: 'raster-dem', encoding: 'custom', redFactor: 256, greenFactor: 1 });
        expect(spec.tiles[0]).toContain('LAYER=raster%3Aelevacion_jalisco_rgb');
        expect(spec.bounds).toEqual([-105.70, 18.95, -101.47, 22.75]);
        expect(buildBaseStyle(null).sources.sombreado.tiles[0]).toBe(spec.tiles[0]);
    });
});

describe('estilo base', () => {
    it('pone el mapa base bajo el sombreado y las etiquetas encima', () => {
        const style = buildBaseStyle({ tiles: 'https://basemaps.cartocdn.com/a/{z}/{x}/{y}{r}.png', labelsTiles: 'https://basemaps.cartocdn.com/b/{z}/{x}/{y}{r}.png' });
        expect(style.layers.map(layer => layer.id)).toEqual(['fondo', 'base', RELIEF_LAYER_ID, 'etiquetas']);
        expect(style.sources.base.tiles[0]).toBe('https://basemaps.cartocdn.com/a/{z}/{x}/{y}.png');
    });

    it('sin mapa base conserva terreno y sombreado', () => {
        const style = buildBaseStyle(null);
        expect(style.layers.map(layer => layer.id)).toEqual(['fondo', RELIEF_LAYER_ID]);
        expect(Object.keys(style.sources)).toEqual(['terreno', 'sombreado']);
    });
});

describe('wmsTileUrl', () => {
    it('conserva filtros y parametros de la capa y agrega la caja de MapLibre', () => {
        const url = wmsTileUrl('https://iieg.test/sextante/demografia/wms', {
            LAYERS: 'demografia:poblacion',
            CQL_FILTER: "fecha='2025-01-01'",
            ENV: 'geom:geom_iieg',
            VERSION: '1.1.0',
            TILED: true,
            WIDTH: 999,
        });
        const query = new URLSearchParams(url.split('?')[1].replace('&BBOX={bbox-epsg-3857}', ''));
        expect(query.get('CQL_FILTER')).toBe("fecha='2025-01-01'");
        expect(query.get('ENV')).toBe('geom:geom_iieg');
        expect(query.get('SRS')).toBe('EPSG:3857');
        expect(query.get('WIDTH')).toBe('256');
        expect(query.has('TILED')).toBe(false);
        expect(url.endsWith('&BBOX={bbox-epsg-3857}')).toBe(true);
    });

    it('usa CRS en WMS 1.3.0', () => {
        const url = wmsTileUrl('/wms', { VERSION: '1.3.0' });
        expect(url).toContain('CRS=EPSG%3A3857');
        expect(url).not.toContain('SRS=');
    });

    it('sin url no arma nada', () => {
        expect(wmsTileUrl(null, {})).toBeNull();
    });
});

describe('cqlSegmentFor', () => {
    it('toma el segmento de la capa dentro de una peticion agrupada', () => {
        const params = { LAYERS: 'a:uno,a:dos', CQL_FILTER: "x=1;fecha='2025-01-01'" };
        expect(cqlSegmentFor(params, 'a:dos')).toBe("fecha='2025-01-01'");
        expect(cqlSegmentFor(params, 'a:tres')).toBeNull();
        expect(cqlSegmentFor({ LAYERS: 'a:uno', CQL_FILTER: 'INCLUDE' }, 'a:uno')).toBeNull();
        expect(cqlSegmentFor({ LAYERS: 'a:uno' }, 'a:uno')).toBeNull();
    });
});

describe('canExtrudeLayer', () => {
    it('acepta poligonos con WFS y hexbin', () => {
        expect(canExtrudeLayer(poligono(), 'wms')).toBe(true);
        expect(canExtrudeLayer(poligono({ geometryType: 'point' }), 'hexbin')).toBe(true);
    });

    it('rechaza puntos, rasters y capas sin WFS', () => {
        expect(canExtrudeLayer(poligono({ geometryType: 'point' }), 'wms')).toBe(false);
        expect(canExtrudeLayer(poligono({ wmsConfig: { workspace: 'raster', wfsAvailable: true } }), 'wms')).toBe(false);
        expect(canExtrudeLayer(poligono({ wmsConfig: { workspace: 'demografia', wfsAvailable: false } }), 'wms')).toBe(false);
        expect(canExtrudeLayer(null, 'wms')).toBe(false);
    });
});

describe('cieloSpec', () => {
    it('apaga la niebla sin tocar el cielo y blanquea el cielo sin tocar la niebla', () => {
        const todo = cieloSpec({ cielo: true, niebla: true });
        const sinNiebla = cieloSpec({ cielo: true, niebla: false });
        const sinCielo = cieloSpec({ cielo: false, niebla: true });
        expect(sinNiebla['fog-ground-blend']).toBe(1);
        expect(sinNiebla['sky-color']).toBe(todo['sky-color']);
        expect(sinCielo['atmosphere-blend']).toBe(0);
        expect(sinCielo['fog-ground-blend']).toBe(todo['fog-ground-blend']);
    });
});
