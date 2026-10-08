import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AreaUtilProvider, useAreaUtil } from '@contexts/AreaUtilContext';

const SIN_MARGENES = { left: 0, right: 0, top: 0, bottom: 0 };

describe('useAreaUtil', () => {
    it('entrega margenes en cero fuera del provider', () => {
        const { result } = renderHook(() => useAreaUtil());
        expect(result.current.margenes).toEqual(SIN_MARGENES);
        expect(result.current.acoplado).toBe(false);
    });

    it('el catalogo y el embed leen margenes.left sin reventar', () => {
        const { result } = renderHook(() => useAreaUtil());
        expect(() => `${result.current.margenes.left}px`).not.toThrow();
    });

    it('dentro del provider arranca sin margenes y sin acople', () => {
        const { result } = renderHook(() => useAreaUtil(), { wrapper: AreaUtilProvider });
        expect(result.current.margenes).toEqual(SIN_MARGENES);
        expect(result.current.acoplado).toBe(false);
        expect(typeof result.current.fijarMargenes).toBe('function');
    });
});
