import { describe, it, expect } from 'vitest';
import {
    esOpcionBase, mismasOpciones, normalizarOpciones, opcionesDeValor, opcionesDeValores, valorDeOpciones
} from '@pages/maps/helpers/hexbinOpciones';
import { escribirOpciones, opcionesDeParams } from '@pages/catalogo/helpers/catalogoVista';
import { legendEntries } from '@pages/maps/helpers/hexbinStyles';

describe('opciones del hexbin', () => {
    it('normaliza lo que llega del share o de la URL', () => {
        expect(normalizarOpciones(null)).toEqual({ campo: null, reductor: 'count', metodo: 'quantile' });
        expect(normalizarOpciones({ reductor: 'sum', campo: 'poblacion', metodo: 'jenks' })).toEqual({ campo: 'poblacion', reductor: 'sum', metodo: 'jenks' });
        expect(normalizarOpciones({ reductor: 'sum', campo: '' })).toEqual({ campo: null, reductor: 'count', metodo: 'quantile' });
        expect(normalizarOpciones({ reductor: 'max', campo: 'x', metodo: '<script>' })).toEqual({ campo: null, reductor: 'count', metodo: 'quantile' });
    });

    it('distingue la opción base y compara', () => {
        expect(esOpcionBase({})).toBe(true);
        expect(esOpcionBase({ metodo: 'jenks' })).toBe(false);
        expect(mismasOpciones({ reductor: 'count', campo: 'x' }, {})).toBe(true);
    });

    it('va y vuelve entre el valor del selector y las opciones', () => {
        const opciones = opcionesDeValor('mean:total_casos', 'equalInterval');
        expect(opciones).toEqual({ campo: 'total_casos', reductor: 'mean', metodo: 'equalInterval' });
        expect(valorDeOpciones(opciones)).toBe('mean:total_casos');
        expect(opcionesDeValor('count', 'jenks')).toEqual({ campo: null, reductor: 'count', metodo: 'jenks' });
        expect(opcionesDeValores(['a']).map(o => o.valor)).toEqual(['count', 'sum:a', 'mean:a']);
    });

    it('se escriben y leen en los parámetros del catálogo sin ensuciar la URL base', () => {
        const params = escribirOpciones(new URLSearchParams('agrupar=hex'), { campo: 'pop', reductor: 'sum', metodo: 'jenks' });
        expect(params.toString()).toBe('agrupar=hex&valor=sum%3Apop&clases=jenks');
        expect(opcionesDeParams(params.get('valor'), params.get('clases'))).toEqual({ campo: 'pop', reductor: 'sum', metodo: 'jenks' });
        expect(escribirOpciones(params, {}).toString()).toBe('agrupar=hex');
    });
});

describe('leyenda de valores no enteros', () => {
    it('muestra los cortes redondeados a dos decimales', () => {
        const entries = legendEntries([
            { classIndex: 0, min: 1.234, max: 5.678, count: 1, closed: 'left' },
            { classIndex: 1, min: 5.678, max: 9.999, count: 1, closed: 'both' }
        ], null, false);
        expect(entries.map(({ from, to }) => [from, to])).toEqual([[1.23, 5.68], [5.68, 10]]);
    });
});
