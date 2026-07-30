import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockUseMapsContext, mockSerialize } = vi.hoisted(() => ({
    mockUseMapsContext: vi.fn(),
    mockSerialize: vi.fn(),
}));

vi.mock('@hooks/useMaps', () => ({
    useMapsContext: () => mockUseMapsContext(),
}));

vi.mock('@hooksMaps/useShareSerializer', () => ({
    useShareSerializer: () => mockSerialize,
}));

import { useSessionPersistence, SESSION_STORAGE_KEY } from '@hooksMaps/useSessionPersistence';

const mapaFalso = () => {
    const handlers = {};
    return {
        on: vi.fn((evento, fn) => { handlers[evento] = fn; }),
        un: vi.fn(),
        emit: (evento) => handlers[evento]?.(),
    };
};

const baseCtx = (overrides = {}) => ({
    activeLayerIds: ['establecimientos_salud'],
    filters: {},
    layerOpacities: {},
    hiddenLayerIds: [],
    selectedLayerForSymbology: null,
    baseMapId: 'osm',
    mapRef: { current: null },
    compareMode: null,
    ...overrides,
});

const leerSesion = () => JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));

const avanzarDebounce = () => act(() => { vi.advanceTimersByTime(500); });

describe('useSessionPersistence', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sessionStorage.clear();
        mockSerialize.mockReset();
        mockSerialize.mockReturnValue({ v: 1, mode: 'single', payload: { capas: ['a'] } });
        mockUseMapsContext.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('no persiste si activeLayerIds no es un array', () => {
        mockUseMapsContext.mockReturnValue(baseCtx({ activeLayerIds: undefined }));

        renderHook(() => useSessionPersistence());
        avanzarDebounce();

        expect(mockSerialize).not.toHaveBeenCalled();
        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);
    });

    it('guarda el envelope en sessionStorage tras el debounce', () => {
        mockUseMapsContext.mockReturnValue(baseCtx());

        renderHook(() => useSessionPersistence());
        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);

        avanzarDebounce();

        expect(mockSerialize).toHaveBeenCalledWith('single');
        expect(leerSesion()).toEqual({ v: 1, mode: 'single', payload: { capas: ['a'] } });
    });

    it('no escribe antes de que venza el debounce', () => {
        mockUseMapsContext.mockReturnValue(baseCtx());

        renderHook(() => useSessionPersistence());
        act(() => { vi.advanceTimersByTime(499); });

        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);
    });

    it('colapsa cambios seguidos en una sola escritura', () => {
        mockUseMapsContext.mockReturnValue(baseCtx());
        const { rerender } = renderHook(() => useSessionPersistence());

        act(() => { vi.advanceTimersByTime(200); });
        mockUseMapsContext.mockReturnValue(baseCtx({ baseMapId: 'satelital' }));
        rerender();
        act(() => { vi.advanceTimersByTime(200); });
        mockUseMapsContext.mockReturnValue(baseCtx({ baseMapId: 'topo' }));
        rerender();
        avanzarDebounce();

        expect(mockSerialize).toHaveBeenCalledTimes(1);
    });

    it('serializa en modo swipe con la posicion del comparador', () => {
        mockUseMapsContext.mockReturnValue(baseCtx({
            compareMode: { active: true, swipePosition: 0.3 },
        }));

        renderHook(() => useSessionPersistence());
        avanzarDebounce();

        expect(mockSerialize).toHaveBeenCalledWith('swipe', { position: 0.3 });
    });

    it('usa 0.5 como posicion por defecto del comparador', () => {
        mockUseMapsContext.mockReturnValue(baseCtx({
            compareMode: { active: true, swipePosition: null },
        }));

        renderHook(() => useSessionPersistence());
        avanzarDebounce();

        expect(mockSerialize).toHaveBeenCalledWith('swipe', { position: 0.5 });
    });

    it('no toca sessionStorage si la sesion arranca sin capas', () => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, '{"previo":true}');
        mockUseMapsContext.mockReturnValue(baseCtx({ activeLayerIds: [] }));

        renderHook(() => useSessionPersistence());
        avanzarDebounce();

        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe('{"previo":true}');
        expect(mockSerialize).not.toHaveBeenCalled();
    });

    it('borra la sesion cuando el usuario quita la ultima capa', () => {
        mockUseMapsContext.mockReturnValue(baseCtx());
        const { rerender } = renderHook(() => useSessionPersistence());
        avanzarDebounce();
        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBe(null);

        mockUseMapsContext.mockReturnValue(baseCtx({ activeLayerIds: [] }));
        rerender();

        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);
    });

    it('sigue persistiendo sin capas si el comparador esta activo', () => {
        mockUseMapsContext.mockReturnValue(baseCtx({
            activeLayerIds: [],
            compareMode: { active: true, swipePosition: 0.5 },
        }));

        renderHook(() => useSessionPersistence());
        avanzarDebounce();

        expect(mockSerialize).toHaveBeenCalledWith('swipe', { position: 0.5 });
        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBe(null);
    });

    it('no propaga el error si sessionStorage rechaza la escritura', () => {
        mockUseMapsContext.mockReturnValue(baseCtx());
        const setItem = vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        renderHook(() => useSessionPersistence());
        expect(() => avanzarDebounce()).not.toThrow();
        expect(setItem).toHaveBeenCalledWith(SESSION_STORAGE_KEY, expect.any(String));

        setItem.mockRestore();
    });

    it('no propaga el error si serialize falla', () => {
        mockUseMapsContext.mockReturnValue(baseCtx());
        mockSerialize.mockImplementation(() => { throw new Error('capa invalida'); });

        renderHook(() => useSessionPersistence());
        expect(() => avanzarDebounce()).not.toThrow();
        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);
    });

    it('persiste cuando el mapa termina de moverse', () => {
        const map = mapaFalso();
        mockUseMapsContext.mockReturnValue(baseCtx({ mapRef: { current: map } }));

        renderHook(() => useSessionPersistence());
        avanzarDebounce();
        mockSerialize.mockClear();

        act(() => { map.emit('moveend'); });
        avanzarDebounce();

        expect(map.on).toHaveBeenCalledWith('moveend', expect.any(Function));
        expect(mockSerialize).toHaveBeenCalledTimes(1);
    });

    it('quita el listener de moveend al desmontar', () => {
        const map = mapaFalso();
        mockUseMapsContext.mockReturnValue(baseCtx({ mapRef: { current: map } }));

        const { unmount } = renderHook(() => useSessionPersistence());
        unmount();

        expect(map.un).toHaveBeenCalledWith('moveend', expect.any(Function));
    });

    it('no registra listeners si el mapa aun no existe', () => {
        mockUseMapsContext.mockReturnValue(baseCtx({ mapRef: undefined }));

        expect(() => renderHook(() => useSessionPersistence())).not.toThrow();
    });

    it('cancela la escritura pendiente al desmontar', () => {
        mockUseMapsContext.mockReturnValue(baseCtx());

        const { unmount } = renderHook(() => useSessionPersistence());
        unmount();
        avanzarDebounce();

        expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);
    });
});
