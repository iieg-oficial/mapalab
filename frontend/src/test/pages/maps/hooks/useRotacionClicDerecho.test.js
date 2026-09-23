import { describe, it, expect, vi } from 'vitest';
import { RotarConClicDerecho } from '@pages/maps/hooks/useRotacionClicDerecho';

const evento = (button, pointerType = 'mouse') => {
    const view = { beginInteraction: vi.fn() };
    return { view, e: { originalEvent: { pointerId: 1, button, pointerType }, map: { getView: () => view } } };
};

describe('RotarConClicDerecho', () => {
    it('arranca solo con el boton derecho del mouse', () => {
        const rotar = new RotarConClicDerecho();
        const derecho = evento(2);
        expect(rotar.handleDownEvent(derecho.e)).toBe(true);
        expect(derecho.view.beginInteraction).toHaveBeenCalled();
        expect(rotar.handleDownEvent(evento(0).e)).toBe(false);
        expect(rotar.handleDownEvent(evento(2, 'touch').e)).toBe(false);
    });
});
