import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aggregateFactsFromEventos, peekNextFact, pickNextFact } from '@pages/maps/helpers/funFactPicker';

describe('funFactPicker', () => {
    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    it('retorna null si facts no es array', () => {
        expect(pickNextFact('e1', null)).toBeNull();
        expect(pickNextFact('e1', undefined)).toBeNull();
        expect(pickNextFact('e1', 'not-array')).toBeNull();
    });

    it('retorna null si facts esta vacio', () => {
        expect(pickNextFact('e1', [])).toBeNull();
    });

    it('retorna null si todos los facts son vacios o invalidos', () => {
        expect(pickNextFact('e1', ['', '   ', null])).toBeNull();
        expect(pickNextFact('e1', [{ text: '' }, { text: '   ' }])).toBeNull();
    });

    it('normaliza strings legacy a objetos {text, symbol:null, animacion:null, destino:null}', () => {
        const result = pickNextFact('e1', ['un dato curioso']);
        expect(result).toEqual({ text: 'un dato curioso', symbol: null, animacion: null, destino: null });
    });

    it('preserva symbol cuando viene en el objeto', () => {
        const symbol = { symbolId: 5, kind: 'emoji', value: '⭐' };
        const result = pickNextFact('e1', [{ text: 'hola', symbol }]);
        expect(result).toEqual({ text: 'hola', symbol, animacion: null, destino: null });
    });

    it('trim del texto al normalizar', () => {
        const result = pickNextFact('e1', ['  hola  ']);
        expect(result.text).toBe('hola');
    });

    it('no repite hasta agotar el pool (shuffle bag por evento)', () => {
        const facts = ['a', 'b', 'c'];
        const picked = new Set();
        picked.add(pickNextFact('e2', facts).text);
        picked.add(pickNextFact('e2', facts).text);
        picked.add(pickNextFact('e2', facts).text);
        expect(picked.size).toBe(3);
    });

    it('preserva la animación propia del dato', () => {
        const result = pickNextFact('e3', [{ text: 'vuela', animacion: 'aguilas' }]);
        expect(result.animacion).toBe('aguilas');
    });

    it('al juntar eventos, cada dato toma su animación o la de su evento', () => {
        const facts = aggregateFactsFromEventos([
            { animacion: 'aguilas', facts: [{ text: 'hereda' }, { text: 'propia', animacion: 'pelota' }] },
            { facts: [{ text: 'sin nada' }] },
        ]);
        expect(facts.map((f) => f.animacion)).toEqual(['aguilas', 'pelota', 'pelota']);
    });

    it('peekNextFact muestra el siguiente sin sacarlo de la bolsa', () => {
        const facts = ['uno', 'dos'];
        const visto = peekNextFact('e4', facts);
        expect(peekNextFact('e4', facts)).toEqual(visto);
        expect(pickNextFact('e4', facts)).toEqual(visto);
    });

    it('conserva el destino del dato', () => {
        const destino = { lon: -103.3466, lat: 20.677, zoom: 17 };
        const facts = aggregateFactsFromEventos([{ animacion: 'aguilas', facts: [{ text: 'palacio', destino }, { text: 'sin lugar' }] }]);
        expect(facts.map((f) => f.destino)).toEqual([destino, null]);
        expect(pickNextFact('e5', [{ text: 'palacio', destino }]).destino).toEqual(destino);
    });

    it('bags independientes por eventoId', () => {
        const facts = ['x'];
        const first = pickNextFact('eA', facts);
        const second = pickNextFact('eB', facts);
        expect(first.text).toBe('x');
        expect(second.text).toBe('x');
    });
});
