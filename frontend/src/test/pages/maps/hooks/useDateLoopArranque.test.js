import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';

vi.mock('@pages/maps/helpers/wmsConfig', () => ({ findLayerDef: () => null }));
vi.mock('@services/analyticsService', () => ({ trackRasterLoop: vi.fn() }));
vi.mock('@hooks/useLayerLoading', () => ({ useLayerLoading: () => ({ loadingLayers: new Set() }) }));
vi.mock('@hooks/useLayers', () => ({ useLayers: () => ({ layers: [] }) }));

import { useDateLoop } from '@hooksMaps/useDateLoop';

const meses = { 1: 1, 2: 1, 3: 1, 4: 1 };
const PERIODICIDAD = { fecha: { 2020: meses, 2021: meses, 2022: meses, 2023: meses, 2024: meses, 2025: meses } };
const anio = (y) => generateCQLFilter(new Set([`${y}`]), 'fecha');
const mes = (y, m) => generateCQLFilter(new Set([`${y}-${m}`]), 'fecha');

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
afterEach(() => vi.useRealTimers());

const montar = (filtroInicial, extra = {}) => {
    const estado = { filtro: filtroInicial };
    const props = {
        applyFilter: vi.fn((id, n, v) => { estado.filtro = v; }),
        clearFilter: vi.fn(),
        applyFilterToSlot: vi.fn(),
        activeLayerIds: ['c'],
        getSpecificFilter: vi.fn(() => estado.filtro),
        getPeriodicity: vi.fn(() => PERIODICIDAD),
        ...extra,
    };
    const hook = renderHook((p) => useDateLoop(p), { initialProps: props });
    return { ...hook, props, estado };
};

describe('useDateLoop — arranque desde la fecha seleccionada', () => {
    it('el loop anual sigue desde el año elegido y no desde el más reciente', () => {
        const { result, props } = montar(anio(2021));
        act(() => result.current.toggleLoop('c'));
        expect(result.current.getLoopState('c').currentKey).toBe(2021);
        expect(props.applyFilter).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(1000));
        expect(props.applyFilter).toHaveBeenLastCalledWith('c', 'date', anio(2020));
    });

    it('sin fecha seleccionada aplica de inmediato el primer valor', () => {
        const { result, props } = montar(null);
        act(() => result.current.toggleLoop('c'));
        expect(props.applyFilter).toHaveBeenCalledWith('c', 'date', anio(2025));
    });

    it('el loop mensual arranca en el mes elegido', () => {
        const { result } = montar(mes(2024, 3));
        act(() => result.current.toggleLoop('c'));
        expect(result.current.getLoopState('c')).toMatchObject({ mode: 'month', year: 2024, currentKey: 3 });
    });
});

describe('useDateLoop — reanudar tras cambiar de fecha', () => {
    it('si la fecha cambió durante la pausa, arranca con el año nuevo', () => {
        const { result, props, estado } = montar(mes(2024, 2));
        act(() => result.current.toggleLoop('c'));
        act(() => vi.advanceTimersByTime(1000));
        act(() => result.current.toggleLoop('c'));
        estado.filtro = mes(2025, 3);
        props.applyFilter.mockClear();
        act(() => result.current.toggleLoop('c'));
        expect(result.current.getLoopState('c')).toMatchObject({ isPlaying: true, year: 2025, currentKey: 3 });
        act(() => vi.advanceTimersByTime(1000));
        expect(props.applyFilter).toHaveBeenLastCalledWith('c', 'date', mes(2025, 4));
    });

    it('si la fecha no cambió, reanuda donde se quedó', () => {
        const { result } = montar(mes(2024, 1));
        act(() => result.current.toggleLoop('c'));
        act(() => vi.advanceTimersByTime(2000));
        act(() => result.current.toggleLoop('c'));
        act(() => result.current.toggleLoop('c'));
        expect(result.current.getLoopState('c')).toMatchObject({ isPlaying: true, year: 2024, currentKey: 3 });
    });

    it('una vista con otro año descarta la animación pausada', () => {
        const { result } = montar(mes(2024, 1));
        act(() => result.current.toggleLoop('c'));
        act(() => result.current.toggleLoop('c'));
        const valores = [1, 2, 3, 4].map(m => ({ key: m, filterValue: mes(2022, m) }));
        act(() => result.current.toggleLoop('c', { mode: 'month', year: 2022, values: valores }));
        expect(result.current.getLoopState('c')).toMatchObject({ year: 2022, currentKey: 1 });
    });
});

describe('useDateLoop — comparador', () => {
    const comparador = (activeSlot) => ({
        active: true,
        activeSlot,
        paneA: { activeLayerIds: ['c'], filters: { c: { date: anio(2021) } } },
        paneB: { activeLayerIds: ['c'], filters: { c: { date: anio(2023) } } },
    });

    it('el loop pertenece al lado donde arrancó aunque cambie el lado activo', () => {
        const { result, props, rerender } = montar(anio(2021), { compareMode: comparador('A') });
        act(() => result.current.toggleLoop('c'));
        expect(result.current.getLoopState('c').slot).toBe('A');
        rerender({ ...props, compareMode: comparador('B') });
        act(() => vi.advanceTimersByTime(1000));
        expect(props.applyFilterToSlot).toHaveBeenLastCalledWith('c', 'A', 'date', anio(2020));
    });

    it('arrancar en el lado inactivo usa la fecha de ese lado', () => {
        const { result, props } = montar(anio(2021), { compareMode: comparador('A') });
        act(() => result.current.toggleLoop('c', null, 'B'));
        expect(result.current.getLoopState('c')).toMatchObject({ slot: 'B', currentKey: 2023 });
        act(() => vi.advanceTimersByTime(1000));
        expect(props.applyFilterToSlot).toHaveBeenLastCalledWith('c', 'B', 'date', anio(2022));
    });

    it('al salir del comparador el loop de un lado se detiene', () => {
        const { result, props, rerender } = montar(anio(2021), { compareMode: comparador('A') });
        act(() => result.current.toggleLoop('c'));
        rerender({ ...props, compareMode: { active: false } });
        act(() => vi.advanceTimersByTime(1000));
        expect(result.current.getLoopState('c').isPlaying).toBe(false);
        expect(props.applyFilter).not.toHaveBeenCalled();
    });
});
