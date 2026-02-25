import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOutsideClick } from '@hooks/useOutsideClick';

const fireMousedown = (target) => {
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
};

const fireTouchstart = (target) => {
    target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
};

describe('useOutsideClick', () => {
    let container;
    let inside;
    let outside;
    let ref;

    beforeEach(() => {
        container = document.createElement('div');
        inside = document.createElement('button');
        outside = document.createElement('span');

        container.appendChild(inside);
        document.body.appendChild(container);
        document.body.appendChild(outside);

        ref = { current: container };
    });

    it('llama al callback al hacer mousedown fuera del elemento', () => {
        const onOutside = vi.fn();
        renderHook(() => useOutsideClick([ref], onOutside));

        fireMousedown(outside);
        expect(onOutside).toHaveBeenCalledTimes(1);
    });

    it('no llama al callback al hacer mousedown dentro del elemento', () => {
        const onOutside = vi.fn();
        renderHook(() => useOutsideClick([ref], onOutside));

        fireMousedown(inside);
        expect(onOutside).not.toHaveBeenCalled();
    });

    it('no llama al callback al hacer mousedown en el propio contenedor', () => {
        const onOutside = vi.fn();
        renderHook(() => useOutsideClick([ref], onOutside));

        fireMousedown(container);
        expect(onOutside).not.toHaveBeenCalled();
    });

    it('llama al callback al hacer touchstart fuera', () => {
        const onOutside = vi.fn();
        renderHook(() => useOutsideClick([ref], onOutside));

        fireTouchstart(outside);
        expect(onOutside).toHaveBeenCalledTimes(1);
    });

    it('soporta múltiples refs y no dispara si el click es en cualquiera de ellas', () => {
        const secondContainer = document.createElement('div');
        document.body.appendChild(secondContainer);
        const secondRef = { current: secondContainer };
        const onOutside = vi.fn();

        renderHook(() => useOutsideClick([ref, secondRef], onOutside));

        fireMousedown(secondContainer);
        expect(onOutside).not.toHaveBeenCalled();

        fireMousedown(outside);
        expect(onOutside).toHaveBeenCalledTimes(1);
    });

    it('no lanza si onOutside es undefined', () => {
        renderHook(() => useOutsideClick([ref], undefined));
        expect(() => fireMousedown(outside)).not.toThrow();
    });

    it('elimina los listeners al desmontar', () => {
        const onOutside = vi.fn();
        const { unmount } = renderHook(() => useOutsideClick([ref], onOutside));

        unmount();
        fireMousedown(outside);
        expect(onOutside).not.toHaveBeenCalled();
    });
});
