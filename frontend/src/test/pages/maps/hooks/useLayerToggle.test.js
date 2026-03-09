import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayerToggle } from '@hooksMaps/useLayerToggle';

vi.mock('@services/analyticsService', () => ({
    trackLayerToggle: vi.fn()
}));

import { trackLayerToggle } from '@services/analyticsService';

const makeSetup = (initialIds = []) => {
    let activeIds = [...initialIds];
    const setActiveLayerIds = vi.fn((updater) => {
        activeIds = typeof updater === 'function' ? updater(activeIds) : updater;
    });
    const getAllChildLayerIds = vi.fn((id) => {
        const children = { 'grupo': ['hijo-1', 'hijo-2'], 'hijo-1': [], 'hijo-2': [] };
        return children[id] || [];
    });
    const findLayerById = vi.fn((id) => ({ id, name: id }));
    const setSelectedLayer = vi.fn();
    return { setActiveLayerIds, getAllChildLayerIds, findLayerById, setSelectedLayer, getActiveIds: () => activeIds };
};

beforeEach(() => { vi.clearAllMocks(); });

describe('useLayerToggle - activar capa', () => {
    it('agrega la capa al activar', () => {
        const setup = makeSetup();
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('capa-a', true));
        expect(setup.getActiveIds()).toContain('capa-a');
    });

    it('agrega la capa y sus hijos al activar un grupo', () => {
        const setup = makeSetup();
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('grupo', true));
        const ids = setup.getActiveIds();
        expect(ids).toContain('grupo');
        expect(ids).toContain('hijo-1');
        expect(ids).toContain('hijo-2');
    });

    it('no duplica ids al activar una capa ya activa', () => {
        const setup = makeSetup(['capa-a']);
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('capa-a', true));
        const ids = setup.getActiveIds();
        expect(ids.filter(id => id === 'capa-a')).toHaveLength(1);
    });
});

describe('useLayerToggle - desactivar capa', () => {
    it('elimina la capa al desactivar', () => {
        const setup = makeSetup(['capa-a', 'capa-b']);
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('capa-a', false));
        expect(setup.getActiveIds()).not.toContain('capa-a');
        expect(setup.getActiveIds()).toContain('capa-b');
    });

    it('elimina la capa y sus hijos al desactivar un grupo', () => {
        const setup = makeSetup(['grupo', 'hijo-1', 'hijo-2']);
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('grupo', false));
        const ids = setup.getActiveIds();
        expect(ids).not.toContain('grupo');
        expect(ids).not.toContain('hijo-1');
        expect(ids).not.toContain('hijo-2');
    });
});

describe('useLayerToggle - analytics', () => {
    it('llama a trackLayerToggle al activar', () => {
        const setup = makeSetup();
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('capa-a', true));
        expect(trackLayerToggle).toHaveBeenCalledWith('capa-a', true);
    });

    it('llama a trackLayerToggle al desactivar', () => {
        const setup = makeSetup(['capa-a']);
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('capa-a', false));
        expect(trackLayerToggle).toHaveBeenCalledWith('capa-a', false);
    });

    it('no llama a trackLayerToggle cuando skipAnalytics es true', () => {
        const setup = makeSetup();
        const { result } = renderHook(() => useLayerToggle(setup));

        act(() => result.current.handleToggleLayer('capa-a', true, true));
        expect(trackLayerToggle).not.toHaveBeenCalled();
    });
});
