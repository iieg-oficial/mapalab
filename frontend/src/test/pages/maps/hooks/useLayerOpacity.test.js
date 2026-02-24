import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayerOpacity } from '@hooksMaps/useLayerOpacity';

const getAllChildLayerIds = vi.fn((id) => {
    const children = { 'grupo': ['hijo-1', 'hijo-2'] };
    return children[id] || [];
});

describe('useLayerOpacity - setLayerOpacity', () => {
    it('establece opacidad para una capa simple', () => {
        const { result } = renderHook(() => useLayerOpacity(getAllChildLayerIds, ['capa-a']));
        act(() => result.current.setLayerOpacity('capa-a', 0.5));
        expect(result.current.getLayerOpacity('capa-a')).toBe(0.5);
    });

    it('establece opacidad para la capa y sus hijos', () => {
        const { result } = renderHook(() => useLayerOpacity(getAllChildLayerIds, ['grupo']));
        act(() => result.current.setLayerOpacity('grupo', 0.7));
        expect(result.current.getLayerOpacity('grupo')).toBe(0.7);
        expect(result.current.getLayerOpacity('hijo-1')).toBe(0.7);
        expect(result.current.getLayerOpacity('hijo-2')).toBe(0.7);
    });

    it('sobreescribe una opacidad previa', () => {
        const { result } = renderHook(() => useLayerOpacity(getAllChildLayerIds, ['capa-a']));
        act(() => result.current.setLayerOpacity('capa-a', 0.3));
        act(() => result.current.setLayerOpacity('capa-a', 0.8));
        expect(result.current.getLayerOpacity('capa-a')).toBe(0.8);
    });
});

describe('useLayerOpacity - getLayerOpacity', () => {
    it('retorna 1 por defecto si no se ha establecido opacidad', () => {
        const { result } = renderHook(() => useLayerOpacity(getAllChildLayerIds, []));
        expect(result.current.getLayerOpacity('capa-sin-opacidad')).toBe(1);
    });

    it('retorna la opacidad establecida', () => {
        const { result } = renderHook(() => useLayerOpacity(getAllChildLayerIds, ['capa-a']));
        act(() => result.current.setLayerOpacity('capa-a', 0.4));
        expect(result.current.getLayerOpacity('capa-a')).toBe(0.4);
    });
});

describe('useLayerOpacity - resetLayerOpacity', () => {
    it('elimina la opacidad de una capa', () => {
        const { result } = renderHook(() => useLayerOpacity(getAllChildLayerIds, ['capa-a']));
        act(() => result.current.setLayerOpacity('capa-a', 0.5));
        act(() => result.current.resetLayerOpacity('capa-a'));
        expect(result.current.getLayerOpacity('capa-a')).toBe(1);
    });

    it('elimina la opacidad de la capa y sus hijos', () => {
        const { result } = renderHook(() => useLayerOpacity(getAllChildLayerIds, ['grupo']));
        act(() => result.current.setLayerOpacity('grupo', 0.5));
        act(() => result.current.resetLayerOpacity('grupo'));
        expect(result.current.getLayerOpacity('grupo')).toBe(1);
        expect(result.current.getLayerOpacity('hijo-1')).toBe(1);
    });
});

describe('useLayerOpacity - limpieza por capas inactivas', () => {
    it('elimina opacidades de capas que se desactivan', () => {
        const { result, rerender } = renderHook(
            ({ activeIds }) => useLayerOpacity(getAllChildLayerIds, activeIds),
            { initialProps: { activeIds: ['capa-a', 'capa-b'] } }
        );

        act(() => {
            result.current.setLayerOpacity('capa-a', 0.5);
            result.current.setLayerOpacity('capa-b', 0.3);
        });

        rerender({ activeIds: ['capa-b'] });

        expect(result.current.getLayerOpacity('capa-a')).toBe(1);
        expect(result.current.getLayerOpacity('capa-b')).toBe(0.3);
    });

    it('preserva opacidades de capas que siguen activas', () => {
        const { result, rerender } = renderHook(
            ({ activeIds }) => useLayerOpacity(getAllChildLayerIds, activeIds),
            { initialProps: { activeIds: ['capa-a'] } }
        );

        act(() => result.current.setLayerOpacity('capa-a', 0.6));
        rerender({ activeIds: ['capa-a'] });

        expect(result.current.getLayerOpacity('capa-a')).toBe(0.6);
    });
});
