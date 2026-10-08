import { describe, it, expect } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { buildHexbinFeatures, pointsFromFeatures } from '@pages/maps/helpers/hexbinLayer';
import { legendEntries, hexbinRamp, baseColorFor, rampFor } from '@pages/maps/helpers/hexbinStyles';

const punto = (lon, lat) => new Feature({ geometry: new Point(fromLonLat([lon, lat], 'EPSG:3857')) });

const GDL = [-103.35, 20.67];
const ZAPOPAN = [-103.42, 20.72];

describe('pointsFromFeatures', () => {
    it('devuelve las coordenadas en lon/lat', () => {
        const [[lon, lat]] = pointsFromFeatures([punto(...GDL)]);
        expect(lon).toBeCloseTo(GDL[0], 4);
        expect(lat).toBeCloseTo(GDL[1], 4);
    });

    it('ignora las features sin geometría de punto', () => {
        expect(pointsFromFeatures([new Feature({})])).toEqual([]);
        expect(pointsFromFeatures(null)).toEqual([]);
    });
});

describe('buildHexbinFeatures', () => {
    it('crea un polígono por celda con su conteo', () => {
        const { features } = buildHexbinFeatures([punto(...GDL), punto(...GDL), punto(...ZAPOPAN)], 7);

        expect(features.length).toBe(2);
        const conteos = features.map(f => f.get('count')).sort();
        expect(conteos).toEqual([1, 2]);
    });

    it('el polígono cierra el anillo', () => {
        const { features } = buildHexbinFeatures([punto(...GDL)], 7);
        const anillo = features[0].getGeometry().getCoordinates()[0];

        expect(anillo.length).toBe(8);
        expect(anillo[0]).toEqual(anillo[anillo.length - 1]);
    });

    it('cada celda lleva su índice H3', () => {
        const { features } = buildHexbinFeatures([punto(...GDL)], 7);
        expect(features[0].get('h3Index')).toMatch(/^[0-9a-f]+$/);
    });

    it('sin puntos no hay celdas ni cortes', () => {
        expect(buildHexbinFeatures([], 7)).toEqual({ features: [], breaks: [], max: 0 });
    });

    it('a más resolución, más celdas', () => {
        const puntos = [punto(...GDL), punto(-103.36, 20.68), punto(-103.37, 20.69)];
        const gruesa = buildHexbinFeatures(puntos, 5).features.length;
        const fina = buildHexbinFeatures(puntos, 9).features.length;
        expect(fina).toBeGreaterThanOrEqual(gruesa);
    });
});

describe('legendEntries', () => {
    it('cubre desde 1 hasta el máximo sin huecos', () => {
        const entries = legendEntries([2, 5, 9], 20);

        expect(entries[0].from).toBe(1);
        expect(entries[entries.length - 1].to).toBe(20);
        entries.slice(1).forEach((entry, i) => {
            expect(entry.from).toBe(entries[i].to + 1);
        });
    });

    it('usa los colores de la rampa en orden', () => {
        const entries = legendEntries([2, 5], 9);
        expect(entries.map(e => e.color)).toEqual(hexbinRamp().slice(0, entries.length));
    });

    it('sin máximo no hay leyenda', () => {
        expect(legendEntries([], null)).toEqual([]);
    });
});

describe('paleta por capa', () => {
    it('rota cada cinco capas', () => {
        expect(baseColorFor(0)).toBe(baseColorFor(5));
        expect(baseColorFor(1)).toBe(baseColorFor(6));
    });

    it('da un tono distinto a cada una de las cinco', () => {
        const tonos = [0, 1, 2, 3, 4].map(baseColorFor);
        expect(new Set(tonos).size).toBe(5);
    });

    it('sobrevive a índices negativos o raros', () => {
        expect(baseColorFor(-1)).toBeTruthy();
        expect(baseColorFor(undefined)).toBe(baseColorFor(0));
    });

    it('cada rampa va de claro a su tono base', () => {
        const rampa = rampFor(1);
        expect(rampa.length).toBe(5);
        expect(rampa[4].toLowerCase()).toBe(baseColorFor(1).toLowerCase());
        expect(rampa[0]).not.toBe(rampa[4]);
    });

    it('la leyenda usa la rampa de su capa', () => {
        const conTono = legendEntries([2, 5], 9, 2);
        expect(conTono.map(e => e.color)).toEqual(rampFor(2).slice(0, conTono.length));
    });
});

describe('colores que el minificador acorta', () => {
    it('la cuarta rampa es un verde válido, no negro', () => {
        const rampa = rampFor(3);
        rampa.forEach(color => expect(color).toMatch(/^#[0-9a-f]{6}$/i));
        expect(rampa[4].toLowerCase()).toBe('#117733');
    });

    it('las cinco rampas dan colores de seis dígitos', () => {
        [0, 1, 2, 3, 4].forEach(i => {
            rampFor(i).forEach(color => expect(color).toMatch(/^#[0-9a-f]{6}$/i));
        });
    });

    it('la leyenda de la cuarta capa no queda vacía', () => {
        const entries = legendEntries([2, 5], 9, 3);
        expect(entries.length).toBeGreaterThan(0);
        entries.forEach(e => expect(e.color).toMatch(/^#[0-9a-f]{6}$/i));
    });
});
