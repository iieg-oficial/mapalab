import { describe, it, expect } from 'vitest';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import { serializeAnnotations } from '@pages/maps/helpers/annotationsSerialization';
import { buildRestoredItems } from '@pages/maps/helpers/restoreAnnotations';

const CENTRO_3857 = [-11500000, 2300000];

const linea = (props = {}) => new Feature({
    geometry: new LineString([CENTRO_3857, [-11400000, 2400000]]),
    ...props,
});

const punto = (props = {}) => new Feature({
    geometry: new Point(CENTRO_3857),
    ...props,
});

const medicion = (overrides = {}) => ({
    id: 'a1',
    type: 'LineString',
    feature: linea(),
    ...overrides,
});

describe('serializeAnnotations', () => {
    it('devuelve null cuando no recibe un array', () => {
        expect(serializeAnnotations(null)).toBe(null);
        expect(serializeAnnotations(undefined)).toBe(null);
        expect(serializeAnnotations({})).toBe(null);
        expect(serializeAnnotations('[]')).toBe(null);
    });

    it('devuelve null con un array vacio', () => {
        expect(serializeAnnotations([])).toBe(null);
    });

    it('serializa id, type, geometry y visible', () => {
        const out = serializeAnnotations([medicion()]);

        expect(out).toHaveLength(1);
        expect(out[0].id).toBe('a1');
        expect(out[0].type).toBe('LineString');
        expect(out[0].visible).toBe(true);
        expect(out[0].geometry.type).toBe('LineString');
    });

    it('escribe la geometria en WGS84 y no en EPSG:3857', () => {
        const [[lon, lat]] = serializeAnnotations([medicion()])[0].geometry.coordinates;

        expect(lon).toBeGreaterThan(-105);
        expect(lon).toBeLessThan(-102);
        expect(lat).toBeGreaterThan(19);
        expect(lat).toBeLessThan(22);
    });

    it('omite las mediciones sin feature', () => {
        expect(serializeAnnotations([{ id: 'a1', type: 'LineString' }])).toBe(null);
        expect(serializeAnnotations([{ id: 'a1', type: 'LineString', feature: null }])).toBe(null);
    });

    it('omite los tipos que no son anotaciones', () => {
        const out = serializeAnnotations([
            medicion({ id: 'ok', type: 'Polygon', feature: new Feature({ geometry: new Polygon([[CENTRO_3857, [-11400000, 2400000], [-11400000, 2300000], CENTRO_3857]]) }) }),
            medicion({ id: 'circulo', type: 'Circle' }),
            medicion({ id: 'punto', type: 'Point', feature: punto() }),
            medicion({ id: 'vacio', type: undefined }),
        ]);

        expect(out.map((e) => e.id)).toEqual(['ok']);
    });

    it('acepta los seis tipos de anotacion, incluida la seleccion', () => {
        const tipos = ['LineString', 'Polygon', 'Select', 'Freehand', 'Text', 'Emoji'];
        const out = serializeAnnotations(tipos.map((type, i) => medicion({ id: `a${i}`, type })));

        expect(out.map((e) => e.type)).toEqual(tipos);
    });

    it('omite la medicion cuando la geometria no se puede escribir', () => {
        const out = serializeAnnotations([
            medicion({ id: 'sin_geom', feature: new Feature({}) }),
            medicion({ id: 'ok' }),
        ]);

        expect(out.map((e) => e.id)).toEqual(['ok']);
    });

    it('devuelve null cuando todas las mediciones se descartan', () => {
        expect(serializeAnnotations([medicion({ type: 'Circle' })])).toBe(null);
    });

    it('respeta visible false y lo asume true si no viene', () => {
        const out = serializeAnnotations([
            medicion({ id: 'oculta', visible: false }),
            medicion({ id: 'sin_flag' }),
            medicion({ id: 'nula', visible: null }),
        ]);

        expect(out.map((e) => e.visible)).toEqual([false, true, true]);
    });

    it('incluye label solo cuando tiene contenido', () => {
        const [conLabel, sinLabel] = serializeAnnotations([
            medicion({ id: 'a', label: '1.2 km' }),
            medicion({ id: 'b', label: '' }),
        ]);

        expect(conLabel.label).toBe('1.2 km');
        expect(sinLabel).not.toHaveProperty('label');
    });

    it('incluye value cuando es cero pero no cuando es null o undefined', () => {
        const [cero, nulo, indefinido] = serializeAnnotations([
            medicion({ id: 'a', value: 0 }),
            medicion({ id: 'b', value: null }),
            medicion({ id: 'c' }),
        ]);

        expect(cero.value).toBe(0);
        expect(nulo).not.toHaveProperty('value');
        expect(indefinido).not.toHaveProperty('value');
    });

    it('toma textLabel de la feature', () => {
        const out = serializeAnnotations([
            medicion({ id: 'a', type: 'Text', feature: linea({ textLabel: 'Zona norte' }) }),
        ]);

        expect(out[0].textLabel).toBe('Zona norte');
    });

    it('serializa rotation solo si es un numero distinto de cero', () => {
        const [girada, sinGiro, invalida] = serializeAnnotations([
            medicion({ id: 'a', feature: linea({ rotation: 0.5 }) }),
            medicion({ id: 'b', feature: linea({ rotation: 0 }) }),
            medicion({ id: 'c', feature: linea({ rotation: '0.5' }) }),
        ]);

        expect(girada.rotation).toBe(0.5);
        expect(sinGiro).not.toHaveProperty('rotation');
        expect(invalida).not.toHaveProperty('rotation');
    });

    it('mapea scale a size y omite la escala neutra', () => {
        const [escalada, neutra] = serializeAnnotations([
            medicion({ id: 'a', feature: linea({ scale: 2 }) }),
            medicion({ id: 'b', feature: linea({ scale: 1 }) }),
        ]);

        expect(escalada.size).toBe(2);
        expect(escalada).not.toHaveProperty('scale');
        expect(neutra).not.toHaveProperty('size');
    });

    it('guarda fillColor y bgColor solo para Text', () => {
        const props = { fillColor: '#111827', bgColor: '#ffffff' };
        const [texto, linestring] = serializeAnnotations([
            medicion({ id: 'a', type: 'Text', feature: linea(props) }),
            medicion({ id: 'b', type: 'LineString', feature: linea(props) }),
        ]);

        expect(texto.fillColor).toBe('#111827');
        expect(texto.bgColor).toBe('#ffffff');
        expect(linestring).not.toHaveProperty('fillColor');
        expect(linestring).not.toHaveProperty('bgColor');
    });

    it('guarda symbolPayload como symbol solo para Emoji', () => {
        const payload = { char: '📍', family: 'pin' };
        const [emoji, texto] = serializeAnnotations([
            medicion({ id: 'a', type: 'Emoji', feature: punto({ symbolPayload: payload }) }),
            medicion({ id: 'b', type: 'Text', feature: punto({ symbolPayload: payload }) }),
        ]);

        expect(emoji.symbol).toEqual(payload);
        expect(texto).not.toHaveProperty('symbol');
    });

    it('guarda stroke solo para Freehand', () => {
        const props = { strokeColor: '#dc2626', strokeWidth: 4 };
        const [freehand, linestring] = serializeAnnotations([
            medicion({ id: 'a', type: 'Freehand', feature: linea(props) }),
            medicion({ id: 'b', type: 'LineString', feature: linea(props) }),
        ]);

        expect(freehand.strokeColor).toBe('#dc2626');
        expect(freehand.strokeWidth).toBe(4);
        expect(linestring).not.toHaveProperty('strokeColor');
        expect(linestring).not.toHaveProperty('strokeWidth');
    });

    it('el resultado sobrevive un round trip por JSON', () => {
        const out = serializeAnnotations([
            medicion({ id: 'a', type: 'Emoji', label: '2 ha', value: 2, feature: punto({ symbolPayload: { char: '📍' }, scale: 1.5 }) }),
        ]);

        expect(JSON.parse(JSON.stringify(out))).toEqual(out);
    });
});

describe('seleccion ida y vuelta', () => {
    it('la seleccion se guarda y vuelve con su geometria y su centro', () => {
        const anillo = [CENTRO_3857, [-11400000, 2400000], [-11400000, 2300000], CENTRO_3857];
        const guardado = serializeAnnotations([
            medicion({ id: 's1', type: 'Select', label: '3 elementos', feature: new Feature({ geometry: new Polygon([anillo]) }) }),
        ]);
        const source = new VectorSource();
        const [restaurada] = buildRestoredItems({ annotations: guardado, source, measurementConfig: {} });

        expect(restaurada.id).toBe('s1');
        expect(restaurada.type).toBe('Select');
        expect(restaurada.label).toBe('3 elementos');
        expect(restaurada.geometry.getType()).toBe('Polygon');
        expect(restaurada.center).toHaveLength(2);
        expect(restaurada.feature.get('annotationType')).toBe('Select');
        expect(source.getFeatures()).toHaveLength(1);
    });
});
