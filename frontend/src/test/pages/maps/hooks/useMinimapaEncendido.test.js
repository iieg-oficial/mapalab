import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { fijarMinimapaEncendido, useMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';

describe('useMinimapaEncendido', () => {
    beforeEach(() => {
        act(() => fijarMinimapaEncendido(true));
    });

    it('apagarlo se recuerda en el navegador y encenderlo borra la marca', () => {
        const { result } = renderHook(() => useMinimapaEncendido());
        expect(result.current[0]).toBe(true);
        act(() => result.current[1]());
        expect(result.current[0]).toBe(false);
        expect(localStorage.getItem('mapalab.minimapa')).toBe('apagado');
        act(() => result.current[1]());
        expect(result.current[0]).toBe(true);
        expect(localStorage.getItem('mapalab.minimapa')).toBeNull();
    });

    it('todos los que lo usan ven el mismo valor', () => {
        const uno = renderHook(() => useMinimapaEncendido());
        const otro = renderHook(() => useMinimapaEncendido());
        act(() => uno.result.current[1]());
        expect(otro.result.current[0]).toBe(false);
    });
});
