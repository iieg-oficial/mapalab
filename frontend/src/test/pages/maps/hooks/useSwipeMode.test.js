import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeMode } from '@hooksMaps/useSwipeMode';
import { SWIPE_ORIGINAL_STORAGE_KEY, SWIPE_ORIENTATION_STORAGE_KEY } from '@pages/maps/helpers/swipeMode';

const makeLive = (initial = {}) => {
    const live = {
        activeLayerIds: initial.activeLayerIds || [],
        hiddenLayerIds: initial.hiddenLayerIds || [],
        layerOpacities: initial.layerOpacities || new Map(),
        filters: initial.filters || {},
        pauseAllLoops: vi.fn(),
    };
    live.setActiveLayerIds = vi.fn((v) => { live.activeLayerIds = v; });
    live.setHiddenLayerIds = vi.fn((v) => { live.hiddenLayerIds = v; });
    live.setLayerOpacities = vi.fn((v) => { live.layerOpacities = v; });
    live.setFilters = vi.fn((v) => { live.filters = v; });
    return live;
};

const buildHook = (live, getAllChildLayerIds = vi.fn(() => [])) => {
    const liveStateRef = { current: live };
    const paneMapRefs = { current: {} };
    return renderHook(() => useSwipeMode({ liveStateRef, getAllChildLayerIds, paneMapRefs }));
};

beforeEach(() => {
    try { localStorage.clear(); } catch { /* jsdom */ }
});

describe('useSwipeMode', () => {
    it('inicializa inactivo con paneA/paneB vacíos', () => {
        const { result } = buildHook(makeLive());
        expect(result.current.compareMode.active).toBe(false);
        expect(result.current.compareMode.paneA.activeLayerIds).toEqual([]);
        expect(result.current.compareMode.paneB.activeLayerIds).toEqual([]);
        expect(result.current.compareMode.globalOrder).toEqual([]);
    });

    it('enterCompareMode snapshotea el live, vacía live, persiste en localStorage', () => {
        const live = makeLive({
            activeLayerIds: ['a', 'b'],
            filters: { a: { date: "fecha = '2020'" } },
        });
        const { result } = buildHook(live);

        act(() => result.current.enterCompareMode());

        expect(result.current.compareMode.active).toBe(true);
        expect(result.current.compareMode.activeSlot).toBe('A');
        expect(result.current.compareMode.originalSnapshot.activeLayerIds).toEqual(['a', 'b']);
        expect(live.setActiveLayerIds).toHaveBeenCalledWith([]);
        expect(live.pauseAllLoops).toHaveBeenCalled();
        expect(localStorage.getItem(SWIPE_ORIGINAL_STORAGE_KEY)).toBeTruthy();
    });

    it('exitCompareMode restaura el snapshot original y limpia el storage', () => {
        const live = makeLive({ activeLayerIds: ['a'] });
        const { result } = buildHook(live);

        act(() => result.current.enterCompareMode());
        act(() => result.current.exitCompareMode());

        expect(result.current.compareMode.active).toBe(false);
        expect(live.setActiveLayerIds).toHaveBeenLastCalledWith(['a']);
        expect(localStorage.getItem(SWIPE_ORIGINAL_STORAGE_KEY)).toBeNull();
    });

    it('setLayerSlotMembership ciclo A → AB → B → A propaga ids correctamente', () => {
        const live = makeLive();
        const { result } = buildHook(live);

        act(() => result.current.enterCompareMode());
        act(() => result.current.setLayerSlotMembership('layer1', 'A'));
        expect(result.current.compareMode.paneA.activeLayerIds).toEqual(['layer1']);
        expect(result.current.compareMode.paneB.activeLayerIds).toEqual([]);

        act(() => result.current.setLayerSlotMembership('layer1', 'AB'));
        expect(result.current.compareMode.paneA.activeLayerIds).toEqual(['layer1']);
        expect(result.current.compareMode.paneB.activeLayerIds).toEqual(['layer1']);

        act(() => result.current.setLayerSlotMembership('layer1', 'B'));
        expect(result.current.compareMode.paneA.activeLayerIds).toEqual([]);
        expect(result.current.compareMode.paneB.activeLayerIds).toEqual(['layer1']);

        act(() => result.current.setLayerSlotMembership('layer1', 'A'));
        expect(result.current.compareMode.paneA.activeLayerIds).toEqual(['layer1']);
        expect(result.current.compareMode.paneB.activeLayerIds).toEqual([]);
    });

    it('setLayerSlotMembership siembra filtros del live cuando la capa no está en ningún pane (B1)', () => {
        const live = makeLive({
            activeLayerIds: ['layer1'],
            filters: { layer1: { date: "fecha = '2024-01-01'" } },
            layerOpacities: new Map([['layer1', 0.7]]),
        });
        const { result } = buildHook(live);

        act(() => result.current.enterCompareMode());

        live.activeLayerIds = ['layer1'];
        live.filters = { layer1: { date: "fecha = '2024-01-01'" } };
        live.layerOpacities = new Map([['layer1', 0.7]]);

        act(() => result.current.setLayerSlotMembership('layer1', 'AB'));

        expect(result.current.compareMode.paneA.filters.layer1.date).toBe("fecha = '2024-01-01'");
        expect(result.current.compareMode.paneB.filters.layer1.date).toBe("fecha = '2024-01-01'");
        expect(result.current.compareMode.paneA.layerOpacities.get('layer1')).toBe(0.7);
    });

    it('removeLayerFromSlot quita ids y mantiene globalOrder consistente', () => {
        const live = makeLive();
        const { result } = buildHook(live);

        act(() => result.current.enterCompareMode());
        act(() => result.current.setLayerSlotMembership('a', 'AB'));
        act(() => result.current.setLayerSlotMembership('b', 'AB'));
        expect(result.current.compareMode.globalOrder).toEqual(['a', 'b']);

        act(() => result.current.removeLayerFromSlot('a', 'A'));
        act(() => result.current.removeLayerFromSlot('a', 'B'));
        expect(result.current.compareMode.paneA.activeLayerIds).toEqual(['b']);
        expect(result.current.compareMode.paneB.activeLayerIds).toEqual(['b']);
        expect(result.current.compareMode.globalOrder).toEqual(['b']);
    });

    it('reorderInSlots reescribe globalOrder y reordena pane activo en live', () => {
        const live = makeLive();
        const { result } = buildHook(live);

        act(() => result.current.enterCompareMode());
        act(() => result.current.setLayerSlotMembership('a', 'AB'));
        act(() => result.current.setLayerSlotMembership('b', 'AB'));

        act(() => result.current.reorderInSlots(['b', 'a']));

        expect(result.current.compareMode.globalOrder).toEqual(['b', 'a']);
        expect(result.current.compareMode.paneA.activeLayerIds).toEqual(['b', 'a']);
        expect(result.current.compareMode.paneB.activeLayerIds).toEqual(['b', 'a']);
        expect(live.setActiveLayerIds).toHaveBeenLastCalledWith(['b', 'a']);
    });

    it('setActiveSlot intercambia live ↔ pane y conserva el snapshot del slot saliente', () => {
        const live = makeLive();
        const { result } = buildHook(live);

        act(() => result.current.enterCompareMode());
        act(() => result.current.setLayerSlotMembership('a', 'A'));

        live.activeLayerIds = ['a'];
        live.filters = { a: { date: 'A-side' } };

        act(() => result.current.setActiveSlot('B'));

        expect(result.current.compareMode.activeSlot).toBe('B');
        expect(result.current.compareMode.paneA.filters.a.date).toBe('A-side');
        expect(live.setActiveLayerIds).toHaveBeenLastCalledWith([]);
    });

    it('setSwipePosition se clamp entre 0.05 y 0.95', () => {
        const live = makeLive();
        const { result } = buildHook(live);
        act(() => result.current.enterCompareMode());

        act(() => result.current.setSwipePosition(0));
        expect(result.current.compareMode.swipePosition).toBe(0.05);

        act(() => result.current.setSwipePosition(1));
        expect(result.current.compareMode.swipePosition).toBe(0.95);

        act(() => result.current.setSwipePosition(0.42));
        expect(result.current.compareMode.swipePosition).toBe(0.42);
    });

    it('toggleSwipeOrientation alterna y persiste en localStorage', () => {
        const live = makeLive();
        const { result } = buildHook(live);
        act(() => result.current.enterCompareMode());

        const initial = result.current.compareMode.swipeOrientation;
        act(() => result.current.toggleSwipeOrientation());
        expect(result.current.compareMode.swipeOrientation).not.toBe(initial);
        expect(localStorage.getItem(SWIPE_ORIENTATION_STORAGE_KEY)).toBe(result.current.compareMode.swipeOrientation);
    });

    it('applyFilterToSlot escribe en pane y propaga a live si es slot activo', () => {
        const live = makeLive();
        const { result } = buildHook(live);
        act(() => result.current.enterCompareMode());
        act(() => result.current.setLayerSlotMembership('a', 'AB'));

        act(() => result.current.applyFilterToSlot('a', 'A', 'date', "fecha = '2020'"));
        expect(result.current.compareMode.paneA.filters.a.date).toBe("fecha = '2020'");
        expect(live.setFilters).toHaveBeenCalled();

        live.setFilters.mockClear();
        act(() => result.current.applyFilterToSlot('a', 'B', 'date', "fecha = '2024'"));
        expect(result.current.compareMode.paneB.filters.a.date).toBe("fecha = '2024'");
        expect(live.setFilters).not.toHaveBeenCalled();
    });

    it('clearFilterFromSlot limpia el filtro y elimina la entrada si queda vacía', () => {
        const live = makeLive();
        const { result } = buildHook(live);
        act(() => result.current.enterCompareMode());
        act(() => result.current.setLayerSlotMembership('a', 'A'));
        act(() => result.current.applyFilterToSlot('a', 'A', 'date', "fecha = '2020'"));

        act(() => result.current.clearFilterFromSlot('a', 'A', 'date'));
        expect(result.current.compareMode.paneA.filters.a).toBeUndefined();
    });

    it('toggleLayerVisibilityInSlot alterna oculto/visible y propaga a live cuando aplica', () => {
        const live = makeLive();
        const { result } = buildHook(live);
        act(() => result.current.enterCompareMode());
        act(() => result.current.setLayerSlotMembership('a', 'A'));

        act(() => result.current.toggleLayerVisibilityInSlot('a', 'A'));
        expect(result.current.compareMode.paneA.hiddenLayerIds).toContain('a');

        act(() => result.current.toggleLayerVisibilityInSlot('a', 'A'));
        expect(result.current.compareMode.paneA.hiddenLayerIds).not.toContain('a');
    });
});
