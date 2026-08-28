import { describe, it, expect } from 'vitest';
import {
    isComposedDef,
    isJoinedDef,
    makeValueResolver,
    splitMultivalue,
} from '@pages/maps/components/InfoBox/utils/resolveFieldValue';

const PROPS = {
    CALLE: 'Calz. de los Pirules',
    numero_ext: 71,
    colonia: 'Ciudad Granja',
    cp: '45010',
    vacio: '   ',
    hombres: 120,
    mujeres: '80',
    texto: 'no es número',
};

const resolveWith = (props) => makeValueResolver(props).resolve;

describe('makeValueResolver', () => {
    it('lee un campo simple sin importar mayúsculas', () => {
        const resolve = resolveWith(PROPS);
        expect(resolve('calle')).toBe('Calz. de los Pirules');
        expect(resolve({ field: 'CoLoNiA' })).toBe('Ciudad Granja');
    });

    it('devuelve cadena vacía cuando el campo no existe', () => {
        expect(resolveWith(PROPS)({ field: 'inexistente' })).toBe('');
    });

    it('conserva el tipo numérico del campo simple', () => {
        expect(resolveWith(PROPS)({ field: 'numero_ext' })).toBe(71);
    });

    it('une las partes de un compose con su separador', () => {
        const value = resolveWith(PROPS)({
            compose: ['calle', { field: 'numero_ext', prefix: '#' }, { field: 'colonia', prefix: 'Col. ' }, 'cp'],
            sep: ', ',
        });
        expect(value).toBe('Calz. de los Pirules, #71, Col. Ciudad Granja, 45010');
    });

    it('una parte vacía se va con su prefijo y su sufijo', () => {
        const value = resolveWith({ calle: 'Hidalgo', colonia: 'Centro' })({
            compose: ['calle', { field: 'numero_ext', prefix: '#' }, { field: 'colonia', prefix: 'Col. ' }],
            sep: ', ',
        });
        expect(value).toBe('Hidalgo, Col. Centro');
    });

    it('trata como vacía una parte que solo trae espacios', () => {
        expect(resolveWith(PROPS)({ compose: ['vacio'] })).toBe('');
    });

    it('devuelve vacío cuando todas las partes están vacías', () => {
        expect(resolveWith({ a: null, b: '' })({ compose: ['a', 'b'] })).toBe('');
    });

    it('usa la coma y espacio como separador por defecto', () => {
        expect(resolveWith(PROPS)({ compose: ['colonia', 'cp'] })).toBe('Ciudad Granja, 45010');
    });

    it('field le gana a compose cuando vienen los dos', () => {
        expect(resolveWith(PROPS)({ field: 'colonia', compose: ['calle', 'cp'] })).toBe('Ciudad Granja');
    });

    it('suma las partes numéricas e ignora las que no lo son', () => {
        expect(resolveWith(PROPS)({ compose: ['hombres', 'mujeres', 'texto'], op: 'sum' })).toBe(200);
    });

    it('devuelve vacío si ninguna parte de la suma es numérica', () => {
        expect(resolveWith(PROPS)({ compose: ['texto', 'inexistente'], op: 'sum' })).toBe('');
    });

    it('ignora un compose sin partes utilizables', () => {
        expect(resolveWith(PROPS)({ compose: [] })).toBe('');
        expect(resolveWith(PROPS)({ compose: [{ prefix: 'Col. ' }] })).toBe('');
    });
});

describe('splitMultivalue', () => {
    it('parte por punto y coma con o sin espacios', () => {
        expect(splitMultivalue('React; OpenLayers;FastAPI')).toEqual(['React', 'OpenLayers', 'FastAPI']);
    });

    it('no parte por coma', () => {
        expect(splitMultivalue('Zapopan, Jal.')).toEqual(['Zapopan, Jal.']);
    });

    it('descarta elementos vacíos y separadores colgantes', () => {
        expect(splitMultivalue('a; ; b; ')).toEqual(['a', 'b']);
    });

    it('devuelve vacío para lo que no es cadena', () => {
        expect(splitMultivalue(42)).toEqual([]);
        expect(splitMultivalue(null)).toEqual([]);
    });
});

describe('isComposedDef / isJoinedDef', () => {
    it('distingue una definición compuesta de una simple', () => {
        expect(isComposedDef({ compose: ['a', 'b'] })).toBe(true);
        expect(isComposedDef({ field: 'a', compose: ['b'] })).toBe(false);
        expect(isComposedDef({ field: 'a' })).toBe(false);
        expect(isComposedDef('a')).toBe(false);
    });

    it('la suma no cuenta como unión de texto', () => {
        expect(isJoinedDef({ compose: ['a', 'b'] })).toBe(true);
        expect(isJoinedDef({ compose: ['a', 'b'], op: 'sum' })).toBe(false);
    });
});
