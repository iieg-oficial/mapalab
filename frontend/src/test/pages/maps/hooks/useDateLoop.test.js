import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@pages/maps/helpers/wmsConfig', () => ({
    findLayerDef: () => null
}));

vi.mock('@pages/maps/helpers/layers/index', () => ({
    layers: []
}));

vi.mock('@services/analyticsService', () => ({
    trackRasterLoop: vi.fn()
}));

const loadingLayersMock = new Set();
vi.mock('@hooks/useLayerLoading', () => ({
    useLayerLoading: () => ({ loadingLayers: loadingLayersMock })
}));

import { useDateLoop, DEFAULT_LOOP_INTERVAL_MS, DEFAULT_LOOP_DIRECTION } from '@hooksMaps/useDateLoop';

const buildHookProps = () => ({
    applyFilter: vi.fn(),
    clearFilter: vi.fn(),
    activeLayerIds: [],
    getSpecificFilter: vi.fn(() => null),
    getPeriodicity: vi.fn(() => null)
});

const sampleValues = [
    { key: 2024, filterValue: '2024' },
    { key: 2025, filterValue: '2025' },
    { key: 2026, filterValue: '2026' }
];

beforeEach(() => {
    loadingLayersMock.clear();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useDateLoop — loopPrefs per-layer', () => {
    it('getLoopPrefs devuelve defaults cuando no hay preferencia guardada', () => {
        const { result } = renderHook(() => useDateLoop(buildHookProps()));
        expect(result.current.getLoopPrefs('capa-x')).toEqual({
            intervalMs: DEFAULT_LOOP_INTERVAL_MS,
            direction: DEFAULT_LOOP_DIRECTION
        });
    });

    it('setLoopIntervalMs guarda el valor solo para la capa indicada', () => {
        const { result } = renderHook(() => useDateLoop(buildHookProps()));

        act(() => result.current.setLoopIntervalMs('capa-a', 1000));

        expect(result.current.getLoopPrefs('capa-a').intervalMs).toBe(1000);
        expect(result.current.getLoopPrefs('capa-b').intervalMs).toBe(DEFAULT_LOOP_INTERVAL_MS);
    });

    it('setLoopIntervalMs clampa valores fuera de rango [100, 10000]', () => {
        const { result } = renderHook(() => useDateLoop(buildHookProps()));

        act(() => result.current.setLoopIntervalMs('capa-a', 50));
        expect(result.current.getLoopPrefs('capa-a').intervalMs).toBe(100);

        act(() => result.current.setLoopIntervalMs('capa-a', 99999));
        expect(result.current.getLoopPrefs('capa-a').intervalMs).toBe(10000);
    });

    it('setLoopDirection normaliza valores no válidos a "ltr"', () => {
        const { result } = renderHook(() => useDateLoop(buildHookProps()));

        act(() => result.current.setLoopDirection('capa-a', 'rtl'));
        expect(result.current.getLoopPrefs('capa-a').direction).toBe('rtl');

        act(() => result.current.setLoopDirection('capa-a', 'cualquier-otra-cosa'));
        expect(result.current.getLoopPrefs('capa-a').direction).toBe('ltr');
    });

    it('cleanupLoop elimina la preferencia de la capa', () => {
        const props = buildHookProps();
        const { result } = renderHook(() => useDateLoop(props));

        act(() => result.current.setLoopIntervalMs('capa-a', 2000));
        expect(result.current.getLoopPrefs('capa-a').intervalMs).toBe(2000);

        act(() => result.current.cleanupLoop('capa-a'));
        expect(result.current.getLoopPrefs('capa-a').intervalMs).toBe(DEFAULT_LOOP_INTERVAL_MS);
    });

    it('las preferencias de distintas capas son independientes', () => {
        const { result } = renderHook(() => useDateLoop(buildHookProps()));

        act(() => {
            result.current.setLoopIntervalMs('capa-a', 1000);
            result.current.setLoopDirection('capa-a', 'rtl');
            result.current.setLoopIntervalMs('capa-b', 3000);
        });

        expect(result.current.getLoopPrefs('capa-a')).toEqual({ intervalMs: 1000, direction: 'rtl' });
        expect(result.current.getLoopPrefs('capa-b')).toEqual({ intervalMs: 3000, direction: DEFAULT_LOOP_DIRECTION });
    });
});

describe('useDateLoop — pauseAllLoops', () => {
    it('hasActiveLoops refleja si alguna capa está corriendo', () => {
        const props = { ...buildHookProps(), activeLayerIds: ['capa-a'] };
        const { result } = renderHook((p) => useDateLoop(p), { initialProps: props });

        expect(result.current.hasActiveLoops).toBe(false);

        act(() => result.current.startLoop('capa-a', { mode: 'year', values: sampleValues }));
        expect(result.current.hasActiveLoops).toBe(true);

        act(() => result.current.stopLoop('capa-a'));
        expect(result.current.hasActiveLoops).toBe(false);
    });

    it('pauseAllLoops detiene todos los loops activos', () => {
        const props = { ...buildHookProps(), activeLayerIds: ['capa-a', 'capa-b'] };
        const { result } = renderHook((p) => useDateLoop(p), { initialProps: props });

        act(() => {
            result.current.startLoop('capa-a', { mode: 'year', values: sampleValues });
            result.current.startLoop('capa-b', { mode: 'year', values: sampleValues });
        });
        expect(result.current.hasActiveLoops).toBe(true);

        act(() => result.current.pauseAllLoops());
        expect(result.current.getLoopState('capa-a')?.isPlaying).toBe(false);
        expect(result.current.getLoopState('capa-b')?.isPlaying).toBe(false);
        expect(result.current.hasActiveLoops).toBe(false);
    });
});

describe('useDateLoop — doTick usa prefs per-layer', () => {
    it('doTick aplica el intervalMs de la capa activa', () => {
        const props = { ...buildHookProps(), activeLayerIds: ['capa-a'] };
        const { result } = renderHook((p) => useDateLoop(p), { initialProps: props });

        act(() => result.current.setLoopIntervalMs('capa-a', 1000));
        act(() => result.current.startLoop('capa-a', { mode: 'year', values: sampleValues }));

        act(() => { vi.advanceTimersByTime(999); });
        expect(props.applyFilter).not.toHaveBeenCalled();

        act(() => { vi.advanceTimersByTime(1); });
        expect(props.applyFilter).toHaveBeenCalledTimes(1);
        expect(props.applyFilter).toHaveBeenLastCalledWith('capa-a', 'date', '2025');
    });

    it('doTick respeta la dirección rtl avanzando al valor anterior', () => {
        const props = { ...buildHookProps(), activeLayerIds: ['capa-a'] };
        const { result } = renderHook((p) => useDateLoop(p), { initialProps: props });

        act(() => {
            result.current.setLoopIntervalMs('capa-a', 500);
            result.current.setLoopDirection('capa-a', 'rtl');
        });
        act(() => result.current.startLoop('capa-a', { mode: 'year', values: sampleValues }));

        act(() => { vi.advanceTimersByTime(500); });
        expect(props.applyFilter).toHaveBeenLastCalledWith('capa-a', 'date', '2026');
    });

    it('cada capa puede correr con su propio intervalMs en paralelo', () => {
        const props = { ...buildHookProps(), activeLayerIds: ['capa-a', 'capa-b'] };
        const { result } = renderHook((p) => useDateLoop(p), { initialProps: props });

        act(() => {
            result.current.setLoopIntervalMs('capa-a', 500);
            result.current.setLoopIntervalMs('capa-b', 1000);
        });
        act(() => {
            result.current.startLoop('capa-a', { mode: 'year', values: sampleValues });
            result.current.startLoop('capa-b', { mode: 'year', values: sampleValues });
        });

        act(() => { vi.advanceTimersByTime(500); });
        const calledLayers = props.applyFilter.mock.calls.map(c => c[0]);
        expect(calledLayers).toContain('capa-a');
        expect(calledLayers).not.toContain('capa-b');

        act(() => { vi.advanceTimersByTime(500); });
        const after1000 = props.applyFilter.mock.calls.map(c => c[0]);
        expect(after1000).toContain('capa-b');
    });
});

describe('useDateLoop — auto-pausa por visibilidad', () => {
    it('detiene el loop cuando la capa pasa a estar oculta', () => {
        const props = { ...buildHookProps(), activeLayerIds: ['capa-a'], hiddenLayerIds: [] };
        const { result, rerender } = renderHook((p) => useDateLoop(p), { initialProps: props });

        act(() => result.current.startLoop('capa-a', { mode: 'year', values: sampleValues }));
        expect(result.current.getLoopState('capa-a')?.isPlaying).toBe(true);

        rerender({ ...props, hiddenLayerIds: ['capa-a'] });
        expect(result.current.getLoopState('capa-a')?.isPlaying).toBe(false);
    });

    it('no afecta loops de capas visibles', () => {
        const props = { ...buildHookProps(), activeLayerIds: ['capa-a', 'capa-b'], hiddenLayerIds: [] };
        const { result, rerender } = renderHook((p) => useDateLoop(p), { initialProps: props });

        act(() => {
            result.current.startLoop('capa-a', { mode: 'year', values: sampleValues });
            result.current.startLoop('capa-b', { mode: 'year', values: sampleValues });
        });

        rerender({ ...props, hiddenLayerIds: ['capa-a'] });

        expect(result.current.getLoopState('capa-a')?.isPlaying).toBe(false);
        expect(result.current.getLoopState('capa-b')?.isPlaying).toBe(true);
    });
});
