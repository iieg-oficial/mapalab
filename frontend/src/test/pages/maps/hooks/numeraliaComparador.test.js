import { describe, it, expect } from 'vitest';
import { construirFilas, esProporcional, aNumero } from '@hooksMaps/useNumeraliaComparador';

const slot = (nombre, valor, op = 'count_where') => ({ nombre, valor, receta: { op } });

const columna = (clave, valores) => ({ clave, numeralia: valores });

describe('aNumero', () => {
    it('limpia separadores de miles', () => {
        expect(aNumero('15 842')).toBe(15842);
        expect(aNumero('1,208')).toBe(1208);
    });

    it('devuelve null para vacíos y no numéricos', () => {
        expect(aNumero(null)).toBeNull();
        expect(aNumero('')).toBeNull();
        expect(aNumero('N/D')).toBeNull();
    });

    it('conserva el cero', () => {
        expect(aNumero('0')).toBe(0);
    });
});

describe('esProporcional', () => {
    it('acepta conteos y sumas', () => {
        expect(esProporcional(slot('a', '1', 'count'))).toBe(true);
        expect(esProporcional(slot('a', '1', 'count_distinct'))).toBe(true);
        expect(esProporcional(slot('a', '1', 'sum'))).toBe(true);
    });

    it('rechaza promedios, extremos y estáticos', () => {
        expect(esProporcional(slot('a', '1', 'avg'))).toBe(false);
        expect(esProporcional(slot('a', '1', 'max'))).toBe(false);
        expect(esProporcional(slot('a', '1', 'static'))).toBe(false);
        expect(esProporcional({ nombre: 'a', valor: '1' })).toBe(false);
    });
});

describe('construirFilas', () => {
    const columnas = [
        columna('039', [slot('Total', '1000', 'count'), slot('Público', '700'), slot('Privado', '300')]),
        columna('120', [slot('Total', '500', 'count'), slot('Público', '250'), slot('Privado', '250')]),
        columna('039b', [slot('Total', '200', 'count'), slot('Público', '100'), slot('Privado', '100')]),
    ];

    it('deja la primera fila en absolutos pero tambien la marca', () => {
        const [base] = construirFilas(columnas);
        expect(base.esBase).toBe(true);
        expect(base.celdas.map(c => c.bruto)).toEqual([1000, 500, 200]);
        expect(base.celdas.map(c => c.porcentaje)).toEqual([null, null, null]);
        expect(base.alto.columna).toBe(0);
        expect(base.bajo.columna).toBe(2);
    });

    it('calcula porcentajes contra el total de cada municipio', () => {
        const [, publico] = construirFilas(columnas);
        expect(publico.celdas.map(c => c.texto)).toEqual(['70.0%', '50.0%', '50.0%']);
    });

    it('marca el mas alto y el mas bajo a la vez', () => {
        const [, publico] = construirFilas(columnas);
        expect(publico.alto.columna).toBe(0);
        expect(publico.bajo.columna).toBe(2);
    });

    it('mide la ventaja del alto contra el segundo y la del bajo contra el penultimo', () => {
        const [, publico] = construirFilas(columnas);
        expect(publico.alto.ventaja).toBeCloseTo(20);
        expect(publico.bajo.ventaja).toBeCloseTo(0);
    });

    it('no marca nada cuando todos empatan', () => {
        const empatadas = [
            columna('039', [slot('Total', '1000', 'count'), slot('Público', '500')]),
            columna('120', [slot('Total', '200', 'count'), slot('Público', '100')]),
        ];
        const [, publico] = construirFilas(empatadas);
        expect(publico.alto).toBeNull();
        expect(publico.bajo).toBeNull();
    });

    it('alinea por nombre aunque a un municipio le falte un slot', () => {
        const dispares = [
            columna('039', [slot('Total', '1000', 'count'), slot('Superior', '30')]),
            columna('120', [slot('Total', '500', 'count')]),
        ];
        const filas = construirFilas(dispares);
        const superior = filas.find(f => f.nombre === 'Superior');
        expect(superior.celdas[0].texto).toBe('3.0%');
        expect(superior.celdas[1].texto).toBeNull();
        expect(superior.alto).toBeNull();
    });

    it('deja en absoluto los slots que no son proporcionales', () => {
        const conPromedio = [
            columna('039', [slot('Total', '1000', 'count'), slot('Promedio', '4.5', 'avg')]),
            columna('120', [slot('Total', '500', 'count'), slot('Promedio', '6.2', 'avg')]),
        ];
        const [, promedio] = construirFilas(conPromedio);
        expect(promedio.celdas.map(c => c.texto)).toEqual(['4.5', '6.2']);
        expect(promedio.enPuntos).toBe(false);
        expect(promedio.alto.columna).toBe(1);
        expect(promedio.bajo.columna).toBe(0);
    });

    it('no divide entre cero', () => {
        const vacias = [
            columna('039', [slot('Total', '0', 'count'), slot('Público', '0')]),
            columna('120', [slot('Total', '500', 'count'), slot('Público', '250')]),
        ];
        const [, publico] = construirFilas(vacias);
        expect(publico.celdas[0].texto).toBe('0');
        expect(publico.celdas[1].texto).toBe('50.0%');
    });
});
