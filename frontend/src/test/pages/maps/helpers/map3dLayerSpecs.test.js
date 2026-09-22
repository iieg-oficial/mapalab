import { describe, it, expect } from 'vitest';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import {
    EXTRUSION_PROPERTY_KEY,
    maxOf,
    replaceLayers,
    vectorLayerSpecs,
} from '@pages/maps/helpers/map3dLayerSpecs';
import { bakedCollection, geometryKind, toLonLatCollection } from '@pages/maps/helpers/olToGeojson';

const cuadro = () => new Polygon([[
    fromLonLat([-103.4, 20.6]), fromLonLat([-103.3, 20.6]), fromLonLat([-103.3, 20.7]), fromLonLat([-103.4, 20.6]),
]]);

const fakeMap = (initial = []) => {
    const layers = [...initial];
    return {
        layers,
        getStyle: () => ({ layers: layers.map(id => ({ id })) }),
        getLayer: (id) => (layers.includes(id) ? { id } : undefined),
        removeLayer: (id) => layers.splice(layers.indexOf(id), 1),
        addLayer: (spec, before) => {
            const index = before ? layers.indexOf(before) : -1;
            if (index < 0) layers.push(spec.id);
            else layers.splice(index, 0, spec.id);
        },
    };
};

describe('vectorLayerSpecs', () => {
    it('dibuja poligonos planos con relleno y contorno horneados', () => {
        const specs = vectorLayerSpecs('vec-1', 'polygon', { opacity: 0.5 });
        expect(specs.map(spec => spec.type)).toEqual(['fill', 'line']);
        expect(specs[0].paint['fill-color']).toEqual(['get', '_fill']);
        expect(specs[0].paint['fill-opacity']).toBe(0.5);
    });

    it('extruye poligonos guardando el campo en la metadata', () => {
        const [spec] = vectorLayerSpecs('vec-1', 'polygon', { extrusion: { property: 'count', maxValue: 10, color: ['get', '_fill'] } });
        expect(spec.type).toBe('fill-extrusion');
        expect(spec.metadata[EXTRUSION_PROPERTY_KEY]).toBe('count');
        expect(spec.paint['fill-extrusion-height']).toEqual(['*', ['max', 0, ['to-number', ['get', 'count'], 0]], 4500]);
    });

    it('puntos como circulos y lineas como lineas', () => {
        expect(vectorLayerSpecs('v', 'point')[0].type).toBe('circle');
        expect(vectorLayerSpecs('v', 'line')[0].type).toBe('line');
        expect(vectorLayerSpecs('v', null)).toEqual([]);
    });
});

describe('replaceLayers', () => {
    it('reemplaza las capas del mismo origen bajo el sombreado y deja las extrusiones arriba', () => {
        const map = fakeMap(['fondo', 'vec-1-fill', 'sombreado']);
        replaceLayers(map, 'vec-1', vectorLayerSpecs('vec-1', 'polygon'), 'sombreado');
        expect(map.layers).toEqual(['fondo', 'vec-1-fill', 'vec-1-line', 'sombreado']);
        replaceLayers(map, 'vec-1', vectorLayerSpecs('vec-1', 'polygon', { extrusion: { property: 'v', maxValue: 1, color: '#000' } }), 'sombreado');
        expect(map.layers).toEqual(['fondo', 'sombreado', 'vec-1-ext']);
    });
});

describe('conversion de features de OpenLayers', () => {
    it('hornea el color del estilo de la capa y reproyecta a lon/lat', () => {
        const feature = new Feature({ geometry: cuadro(), count: 7 });
        const layer = new VectorLayer({
            source: new VectorSource({ features: [feature] }),
            style: () => new Style({ fill: new Fill({ color: [92, 36, 114, 0.75] }), stroke: new Stroke({ color: '#ffffff' }) }),
        });
        const collection = bakedCollection(layer, 100);
        const [out] = collection.features;
        expect(out.properties._fill).toBe('rgba(92,36,114,0.75)');
        expect(out.properties._stroke).toBe('#ffffff');
        expect(out.properties.count).toBe(7);
        expect(out.geometry.coordinates[0][0][0]).toBeCloseTo(-103.4, 5);
        expect(geometryKind(collection)).toBe('polygon');
        expect(maxOf(collection.features, 'count')).toBe(7);
    });

    it('reproyecta GeoJSON de WFS en 3857', () => {
        const [x, y] = fromLonLat([-103.35, 20.67]);
        const json = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { v: 1 }, geometry: { type: 'Point', coordinates: [x, y] } }] };
        const [out] = toLonLatCollection(json).features;
        expect(out.geometry.coordinates[0]).toBeCloseTo(-103.35, 5);
        expect(out.geometry.coordinates[1]).toBeCloseTo(20.67, 5);
        expect(geometryKind({ features: [{ geometry: { type: 'MultiLineString' } }] })).toBe('line');
    });
});
