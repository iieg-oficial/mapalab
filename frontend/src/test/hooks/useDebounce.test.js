import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@hooks/useDebounce';

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useDebounce', () => {
    it('retorna el valor inicial sin esperar el delay', () => {
        const { result } = renderHook(() => useDebounce('inicial', 500));
        expect(result.current).toBe('inicial');
    });

    it('actualiza el valor después del delay', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'inicial' } }
        );

        rerender({ value: 'actualizado' });
        expect(result.current).toBe('inicial');

        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toBe('actualizado');
    });

    it('no actualiza antes de que termine el delay', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'inicial' } }
        );

        rerender({ value: 'actualizado' });
        act(() => { vi.advanceTimersByTime(300); });
        expect(result.current).toBe('inicial');
    });

    it('cancela el timer anterior si el valor cambia antes del delay', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'a' } }
        );

        rerender({ value: 'b' });
        act(() => { vi.advanceTimersByTime(300); });

        rerender({ value: 'c' });
        act(() => { vi.advanceTimersByTime(300); });
        expect(result.current).toBe('a');

        act(() => { vi.advanceTimersByTime(200); });
        expect(result.current).toBe('c');
    });

    it('funciona con delay cero', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 0),
            { initialProps: { value: 'inicial' } }
        );

        rerender({ value: 'nuevo' });
        act(() => { vi.advanceTimersByTime(0); });
        expect(result.current).toBe('nuevo');
    });

    it('funciona con valores numéricos', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 0 } }
        );

        rerender({ value: 42 });
        act(() => { vi.advanceTimersByTime(300); });
        expect(result.current).toBe(42);
    });
});
