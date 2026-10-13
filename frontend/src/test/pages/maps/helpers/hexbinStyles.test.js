import { describe, it, expect } from 'vitest';
import { classify, legend } from '@ghegar/panal/classify';
import { legendEntries, hexbinRamp, baseColorFor, rampFor, hexbinStyle } from '@pages/maps/helpers/hexbinStyles';

const leyendaDe = (valores, clases = 5) => legend(classify(valores, { method: 'quantile', classes: clases }), valores);

describe('legendEntries', () => {
    it('muestra rangos enteros sin huecos para conteos', () => {
        const entries = legendEntries(leyendaDe([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]));

        expect(entries[0].from).toBe(1);
        expect(entries[entries.length - 1].to).toBe(89);
        entries.slice(1).forEach((entry, i) => {
            expect(entry.from).toBe(entries[i].to + 1);
        });
    });

    it('redondea los cortes interpolados hacia el entero que los contiene', () => {
        const entries = legendEntries([
            { classIndex: 0, min: 4, max: 7.8, count: 1, closed: 'left' },
            { classIndex: 1, min: 7.8, max: 196.2, count: 1, closed: 'both' }
        ]);
        expect(entries.map(({ from, to }) => [from, to])).toEqual([[4, 7], [8, 196]]);
    });

    it('usa los colores de la rampa por clase', () => {
        const entries = legendEntries(leyendaDe([1, 2, 3, 4, 5, 6, 7, 8, 9], 3));
        expect(entries.map(e => e.color)).toEqual(hexbinRamp().slice(0, entries.length));
    });

    it('sin leyenda no hay entradas', () => {
        expect(legendEntries([])).toEqual([]);
        expect(legendEntries(undefined)).toEqual([]);
    });
});

describe('hexbinStyle', () => {
    it('cachea por clase, tono, relleno y selección', () => {
        expect(hexbinStyle(2, { paletteIndex: 1 })).toBe(hexbinStyle(2, { paletteIndex: 1 }));
        expect(hexbinStyle(2, { paletteIndex: 1 })).not.toBe(hexbinStyle(2, { paletteIndex: 1, selectedCell: true }));
    });

    it('una celda sin clase usa el primer color', () => {
        expect(hexbinStyle(-1).getFill().getColor()).toBe(hexbinStyle(0).getFill().getColor());
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
        const conTono = legendEntries(leyendaDe([1, 2, 3, 4, 5, 6, 7, 8, 9], 3), 2);
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
        const entries = legendEntries(leyendaDe([1, 2, 3, 4, 5, 6, 7, 8, 9], 3), 3);
        expect(entries.length).toBeGreaterThan(0);
        entries.forEach(e => expect(e.color).toMatch(/^#[0-9a-f]{6}$/i));
    });
});
