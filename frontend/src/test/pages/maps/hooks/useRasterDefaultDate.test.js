import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const RASTER = { 2024: { 1: 't-2024-01', 6: 't-2024-06' }, 2025: { 2: 't-2025-02', 5: 't-2025-05' } };

vi.mock('@pages/maps/helpers/wmsConfig', () => ({
    findLayerDef: (id) => (id.startsWith('r') ? { rasterPeriodicity: RASTER } : null),
}));

import { useRasterDefaultDate } from '@hooksMaps/useRasterDefaultDate';

const base = () => ({
    activeLayerIds: [],
    allLayers: [],
    compareMode: null,
    getSpecificFilter: vi.fn(() => null),
    applyFilter: vi.fn(),
    clearFilter: vi.fn(),
    applyFilterToSlot: vi.fn(),
});

const comparador = (activeSlot, paneB = {}) => ({
    active: true,
    activeSlot,
    paneA: { activeLayerIds: ['r1'], filters: {} },
    paneB: { activeLayerIds: ['r1'], filters: {}, ...paneB },
});

describe('useRasterDefaultDate', () => {
    it('sin comparador aplica el último mes del año más reciente', () => {
        const props = { ...base(), activeLayerIds: ['r1', 'v1'] };
        renderHook(() => useRasterDefaultDate(props));
        expect(props.applyFilter).toHaveBeenCalledTimes(1);
        expect(props.applyFilter).toHaveBeenCalledWith('r1', 'date', 't-2025-05');
    });

    it('en el comparador aplica el default en los dos lados', () => {
        const props = { ...base(), compareMode: comparador('A') };
        renderHook(() => useRasterDefaultDate(props));
        expect(props.applyFilterToSlot).toHaveBeenCalledWith('r1', 'A', 'date', 't-2025-05');
        expect(props.applyFilterToSlot).toHaveBeenCalledWith('r1', 'B', 'date', 't-2025-05');
    });

    it('no pisa la fecha que ya tiene un lado', () => {
        const props = { ...base(), compareMode: comparador('A', { filters: { r1: { date: 't-2024-01' } } }) };
        renderHook(() => useRasterDefaultDate(props));
        expect(props.applyFilterToSlot).toHaveBeenCalledTimes(1);
        expect(props.applyFilterToSlot).toHaveBeenCalledWith('r1', 'A', 'date', 't-2025-05');
    });

    it('cambiar de lado no vuelve a aplicar el default que el usuario quitó', () => {
        const props = { ...base(), compareMode: comparador('A') };
        const { rerender } = renderHook((p) => useRasterDefaultDate(p), { initialProps: props });
        props.applyFilterToSlot.mockClear();
        rerender({ ...props, compareMode: comparador('B') });
        rerender({ ...props, compareMode: comparador('A') });
        expect(props.applyFilterToSlot).not.toHaveBeenCalled();
    });
});
