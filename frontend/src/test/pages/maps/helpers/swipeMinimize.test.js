import { describe, it, expect } from 'vitest';
import {
    SWIPE_LABEL_GAP,
    SWIPE_MINIMIZE_SCALE,
    minimizeTransform,
} from '@pages/maps/helpers/swipeMode';

const desplazamiento = (transform) => transform
    .match(/translate\((-?\d+)px, (-?\d+)px\)/)
    .slice(1)
    .map(Number);

describe('minimizeTransform', () => {
    it('lleva cada letra hasta su lado del handle en vertical', () => {
        const base = { pos: 50, isHorizontal: false, width: 1000, height: 600 };
        expect(minimizeTransform({ ...base, slot: 'A' })).toBe(`translate(212px, 0px) scale(${SWIPE_MINIMIZE_SCALE})`);
        expect(minimizeTransform({ ...base, slot: 'B' })).toBe(`translate(-212px, 0px) scale(${SWIPE_MINIMIZE_SCALE})`);
    });

    it('se desplaza sobre el eje vertical cuando el comparador es horizontal', () => {
        const base = { pos: 25, isHorizontal: true, width: 1000, height: 600 };
        expect(desplazamiento(minimizeTransform({ ...base, slot: 'A' }))).toEqual([0, 37]);
        expect(desplazamiento(minimizeTransform({ ...base, slot: 'B' }))).toEqual([0, -187]);
    });

    it('deja A antes que B separadas por el hueco del knob, en cualquier posicion', () => {
        const width = 1200;
        [5, 30, 50, 80, 95].forEach((pos) => {
            const base = { pos, isHorizontal: false, width, height: 600 };
            const centroA = (width * pos) / 200;
            const centroB = (width * (100 + pos)) / 200;
            const finA = centroA + desplazamiento(minimizeTransform({ ...base, slot: 'A' }))[0];
            const finB = centroB + desplazamiento(minimizeTransform({ ...base, slot: 'B' }))[0];
            expect(finA).toBeLessThan(finB);
            expect(Math.round(finB - finA)).toBe(SWIPE_LABEL_GAP * 2);
        });
    });

    it('no transforma nada si el contenedor todavia no mide', () => {
        expect(minimizeTransform({ slot: 'A', pos: 50, isHorizontal: false, width: 0, height: 0 })).toBe('none');
    });
});
