import { describe, it, expect } from 'vitest';
import {
    parseLegendRules,
    quantileClasses,
    colorExpression,
    heightExpression,
    numericProperties,
} from '@pages/maps/helpers/extrusionRules';

const polygon = (fill) => [{ Polygon: { geometry: "[property(env('geom','geom_iieg'))]", stroke: '#FFFFFF', fill } }];

const POBLACION = {
    Legend: [{
        layerName: 'poblacion',
        rules: [
            { title: '0 a 2 500', filter: "[poblacion_total >= '0' AND poblacion_total < '2500']", symbolizers: polygon('#FFF2FC') },
            { title: '2 500 a 10 000', filter: "[poblacion_total >= '2500' AND poblacion_total < '10000']", symbolizers: polygon('#FFCCE3') },
            { title: '> 1 000 000', filter: "[poblacion_total >= '1000000']", symbolizers: polygon('#6A0034') },
            { title: 'Sin dato', filter: '[poblacion_total IS NULL]', symbolizers: polygon('#FFFFFF') },
        ],
    }],
};

describe('parseLegendRules', () => {
    it('lee propiedad, cortes y colores de una leyenda de GeoServer', () => {
        const parsed = parseLegendRules(POBLACION);
        expect(parsed.property).toBe('poblacion_total');
        expect(parsed.classes.map(c => c.min)).toEqual([0, 2500, 1000000]);
        expect(parsed.classes.map(c => c.color)).toEqual(['#FFF2FC', '#FFCCE3', '#6A0034']);
        expect(parsed.classes[2].max).toBe(Infinity);
        expect(parsed.nullColor).toBe('#FFFFFF');
    });

    it('descarta leyendas que no son rangos numericos', () => {
        const categorica = { Legend: [{ rules: [{ filter: "[tipo = 'Hospital']", symbolizers: polygon('#123456') }] }] };
        expect(parseLegendRules(categorica)).toBeNull();
    });

    it('descarta reglas sobre dos propiedades distintas', () => {
        const mixta = { Legend: [{ rules: [
            { filter: "[a >= '0' AND a < '5']", symbolizers: polygon('#111111') },
            { filter: "[b >= '5']", symbolizers: polygon('#222222') },
        ] }] };
        expect(parseLegendRules(mixta)).toBeNull();
    });

    it('descarta estilos sin relleno de poligono', () => {
        const puntos = { Legend: [{ rules: [{ filter: "[a >= '0']", symbolizers: [{ Point: { size: 4 } }] }] }] };
        expect(parseLegendRules(puntos)).toBeNull();
        expect(parseLegendRules({})).toBeNull();
    });
});

describe('quantileClasses', () => {
    it('reparte los valores en clases ascendentes sin cortes repetidos', () => {
        const ramp = ['#1', '#2', '#3'];
        const classes = quantileClasses([6, 1, 5, 2, 4, 3], ramp);
        expect(classes.map(c => c.min)).toEqual([1, 2, 4]);
        expect(classes[0].max).toBe(2);
        expect(classes.at(-1).max).toBe(Infinity);
        expect(quantileClasses([7, 7, 7, 7], ramp).map(c => c.min)).toEqual([7]);
    });

    it('devuelve vacio sin valores numericos', () => {
        expect(quantileClasses([Number.NaN], ['#1'])).toEqual([]);
    });
});

describe('expresiones de MapLibre', () => {
    it('arma un step con el color de cada corte y el de sin dato', () => {
        const expr = colorExpression('v', [{ min: 0, color: '#a' }, { min: 10, color: '#b' }], '#fff');
        expect(expr[0]).toBe('case');
        expect(expr[2]).toBe('#fff');
        expect(expr[3]).toEqual(['step', ['to-number', ['get', 'v'], Number.NaN], '#a', 10, '#b']);
    });

    it('escala la altura contra el maximo', () => {
        expect(heightExpression('v', 100, 50000)).toEqual(['*', ['max', 0, ['to-number', ['get', 'v'], 0]], 500]);
        expect(heightExpression('v', 0, 50000)).toBe(0);
        const log = heightExpression('v', Math.E - 1, 1000, { logaritmica: true });
        expect(log[0]).toBe('*');
        expect(log[1]).toEqual(['ln', ['+', 1, ['max', 0, ['to-number', ['get', 'v'], 0]]]]);
        expect(log[2]).toBeCloseTo(1000);
    });
});

describe('numericProperties', () => {
    it('prefiere campos numericos y omite claves e identificadores', () => {
        const features = [
            { properties: { fid: 1, clave_municipio: '001', nombre: 'Acatic', poblacion_total: 23000, tasa: '1.5' } },
            { properties: { fid: 2, clave_municipio: '002', nombre: 'Tala', poblacion_total: 90000, tasa: null } },
        ];
        expect(numericProperties(features)).toEqual(['poblacion_total', 'tasa']);
    });
});
