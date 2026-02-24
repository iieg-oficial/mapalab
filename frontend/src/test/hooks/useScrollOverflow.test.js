import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollOverflow } from '@hooks/useScrollOverflow';

const makeRef = (scrollTop = 0, scrollHeight = 200, clientHeight = 100) => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollTop', { get: () => scrollTop, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true });
    Object.defineProperty(el, 'clientHeight', { get: () => clientHeight, configurable: true });
    return { current: el };
};

beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
        observe = vi.fn();
        disconnect = vi.fn();
    });
    vi.stubGlobal('requestAnimationFrame', (cb) => { cb(); return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useScrollOverflow', () => {
    it('estado inicial es canScrollUp=false, canScrollDown=false sin overflow', () => {
        const ref = makeRef(0, 100, 100);
        const { result } = renderHook(() => useScrollOverflow(ref));
        expect(result.current.canScrollUp).toBe(false);
        expect(result.current.canScrollDown).toBe(false);
    });

    it('detecta que puede hacer scroll hacia abajo', () => {
        const ref = makeRef(0, 200, 100);
        const { result } = renderHook(() => useScrollOverflow(ref));
        expect(result.current.canScrollDown).toBe(true);
        expect(result.current.canScrollUp).toBe(false);
    });

    it('detecta que puede hacer scroll hacia arriba', () => {
        const ref = makeRef(50, 200, 100);
        const { result } = renderHook(() => useScrollOverflow(ref));
        expect(result.current.canScrollUp).toBe(true);
    });

    it('detecta ambas direcciones cuando está en posición media', () => {
        const ref = makeRef(50, 300, 100);
        const { result } = renderHook(() => useScrollOverflow(ref));
        expect(result.current.canScrollUp).toBe(true);
        expect(result.current.canScrollDown).toBe(true);
    });

    it('no hace nada si enabled es false', () => {
        const ref = makeRef(0, 200, 100);
        const { result } = renderHook(() => useScrollOverflow(ref, { enabled: false }));
        expect(result.current.canScrollUp).toBe(false);
        expect(result.current.canScrollDown).toBe(false);
    });

    it('no hace nada si ref.current es null', () => {
        const ref = { current: null };
        const { result } = renderHook(() => useScrollOverflow(ref));
        expect(result.current.canScrollUp).toBe(false);
        expect(result.current.canScrollDown).toBe(false);
    });

    it('expone la función checkScroll', () => {
        const ref = makeRef(0, 200, 100);
        const { result } = renderHook(() => useScrollOverflow(ref));
        expect(typeof result.current.checkScroll).toBe('function');
    });

    it('actualiza el estado al llamar checkScroll manualmente', () => {
        let scrollTop = 0;
        const el = document.createElement('div');
        Object.defineProperty(el, 'scrollTop', { get: () => scrollTop, configurable: true });
        Object.defineProperty(el, 'scrollHeight', { get: () => 200, configurable: true });
        Object.defineProperty(el, 'clientHeight', { get: () => 100, configurable: true });
        const ref = { current: el };

        const { result } = renderHook(() => useScrollOverflow(ref));
        expect(result.current.canScrollDown).toBe(true);

        act(() => {
            scrollTop = 100;
            result.current.checkScroll();
        });

        expect(result.current.canScrollDown).toBe(false);
        expect(result.current.canScrollUp).toBe(true);
    });
});
