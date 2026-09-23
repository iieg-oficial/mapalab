import { describe, it, expect } from 'vitest';
import {
    billboardLayout,
    iconExpression,
    iconSize,
    parsePointRules,
    publicIconUrl,
} from '@pages/maps/helpers/billboardRules';

const regla = (filter, url, size = '15') => ({ filter, symbolizers: [{ Point: { url, size, graphics: [] } }] });
const leyenda = (...rules) => ({ Legend: [{ rules }] });
const ICONO = (n) => `http://10.25.7.17:8080/sextante/styles/salud/svg/ico_${n}.svg`;

describe('parsePointRules', () => {
    it('lee igualdades, nulos y la regla sin filtro sobre un solo campo', () => {
        const parsed = parsePointRules(leyenda(
            regla("[nivel_atencion = 'Primer nivel']", ICONO('primer')),
            regla("[nivel_atencion = 'Segundo nivel']", ICONO('segundo')),
            regla('[nivel_atencion IS NULL]', ICONO('nulo')),
        ));
        expect(parsed.property).toBe('nivel_atencion');
        expect(parsed.rules.map(r => r.filter.type)).toEqual(['eq', 'eq', 'null']);
        expect(parsed.rules[0].size).toBe(21);
    });

    it('una capa de un solo simbolo no necesita campo', () => {
        const parsed = parsePointRules(leyenda(regla('', 'http://h/sextante/kml/icon/general/cabecera_municipal?0.0.0=')));
        expect(parsed.property).toBeNull();
        expect(parsed.rules[0].filter.type).toBe('all');
    });

    it('descarta filtros que no sabe leer o reglas sobre dos campos', () => {
        expect(parsePointRules(leyenda(regla("[a > '5']", ICONO('x'))))).toBeNull();
        expect(parsePointRules(leyenda(regla("[a = '1']", ICONO('x')), regla("[b = '2']", ICONO('y'))))).toBeNull();
        expect(parsePointRules(leyenda({ filter: '', symbolizers: [{ Polygon: {} }] }))).toBeNull();
        expect(parsePointRules({})).toBeNull();
    });
});

describe('iconExpression', () => {
    const idDe = (i) => `pt-salud-${i}`;

    it('elige el icono por valor, con el de nulos antes y sin etiquetas repetidas', () => {
        const parsed = parsePointRules(leyenda(
            regla("[tipo = 'A']", ICONO('a')),
            regla("[tipo = 'A']", ICONO('a2')),
            regla("[tipo = 'B']", ICONO('b')),
            regla('[tipo IS NULL]', ICONO('n')),
        ));
        expect(iconExpression(parsed, idDe)).toEqual([
            'case', ['==', ['typeof', ['get', 'tipo']], 'null'], 'pt-salud-3',
            ['match', ['to-string', ['get', 'tipo']], 'A', 'pt-salud-0', 'B', 'pt-salud-2', 'pt-salud-0'],
        ]);
    });

    it('sin campo usa el unico icono', () => {
        const parsed = parsePointRules(leyenda(regla('', ICONO('x'))));
        expect(iconExpression(parsed, idDe)).toBe('pt-salud-0');
    });
});

describe('utilidades', () => {
    it('reescribe el host interno de GeoServer a la ruta publica', () => {
        expect(publicIconUrl(ICONO('primer'), '/sextante')).toBe('/sextante/styles/salud/svg/ico_primer.svg');
        expect(publicIconUrl('http://10.25.7.17:8080/sextante/kml/icon/general/cab?0.0.0=&0.0.0=', '/sextante'))
            .toBe('/sextante/kml/icon/general/cab?0.0.0=&0.0.0=');
    });

    it('agranda el icono y lo topa', () => {
        expect(iconSize('12')).toBe(17);
        expect(iconSize('60')).toBe(32);
        expect(iconSize(undefined)).toBe(22);
    });

    it('deja el icono de pie, al ras del terreno y de frente a la camara', () => {
        expect(billboardLayout('x')).toMatchObject({
            'icon-anchor': 'bottom',
            'icon-pitch-alignment': 'viewport',
            'icon-rotation-alignment': 'viewport',
        });
    });
});
