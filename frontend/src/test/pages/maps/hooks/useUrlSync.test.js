import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockSetSearchParams, mockUseMapsContext, mockFlag } = vi.hoisted(() => ({
    mockSetSearchParams: vi.fn(),
    mockUseMapsContext: vi.fn(),
    mockFlag: { value: true }
}));

vi.mock('react-router', () => ({
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams]
}));

vi.mock('@hooks/useDebounce', () => ({
    useDebounce: (value) => value
}));

vi.mock('@hooks/useMaps', () => ({
    useMapsContext: () => mockUseMapsContext()
}));

vi.mock('@pages/maps/hooks/useInitializeFromUrl', () => ({
    filtersInitializationComplete: mockFlag
}));

import { useUrlSync } from '@hooksMaps/useUrlSync';

const makeFindLayerById = (overrides = {}) => (id) => {
    const base = {
        'capa-a': { id: 'capa-a' },
        'capa-b': { id: 'capa-b' },
        'etiqueta': { id: 'etiqueta', isLabel: true },
        'grupo': { id: 'grupo', isCategory: true },
        'seleccionado': { id: 'seleccionado' }
    };
    return overrides[id] ?? base[id] ?? null;
};

const setContext = (overrides = {}) => {
    mockUseMapsContext.mockReturnValue({
        activeLayerIds: [],
        filters: {},
        findLayerById: makeFindLayerById(),
        selectedLayerForSymbology: null,
        ...overrides
    });
};

beforeEach(() => {
    vi.clearAllMocks();
    mockFlag.value = true;
});

describe('useUrlSync - primer render', () => {
    it('no escribe en la URL en el primer render', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        renderHook(() => useUrlSync());
        expect(mockSetSearchParams).not.toHaveBeenCalled();
    });
});

describe('useUrlSync - guard de inicialización', () => {
    it('no escribe si filtersInitializationComplete.value es false', () => {
        mockFlag.value = false;
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({ activeLayerIds: ['capa-a', 'capa-b'] });
        rerender();

        expect(mockSetSearchParams).not.toHaveBeenCalled();
    });
});

describe('useUrlSync - construcción de parámetros', () => {
    it('escribe el parámetro layers cuando cambia activeLayerIds', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({ activeLayerIds: ['capa-a', 'capa-b'] });
        rerender();

        expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.get('layers')).toBe('capa-a,capa-b');
    });

    it('marca la capa seleccionada con prefijo *', () => {
        setContext({ activeLayerIds: ['capa-a', 'seleccionado'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({
            activeLayerIds: ['capa-a', 'seleccionado'],
            selectedLayerForSymbology: { id: 'seleccionado' }
        });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.get('layers')).toBe('capa-a,*seleccionado');
    });

    it('excluye capas isLabel del parámetro layers', () => {
        setContext({ activeLayerIds: ['capa-a', 'etiqueta'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({ activeLayerIds: ['capa-a', 'etiqueta', 'capa-b'] });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.get('layers')).toBe('capa-a,capa-b');
    });

    it('excluye capas isCategory salvo que sean la seleccionada', () => {
        setContext({ activeLayerIds: ['capa-a', 'grupo'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({ activeLayerIds: ['capa-a', 'grupo', 'capa-b'] });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.get('layers')).toBe('capa-a,capa-b');
    });

    it('incluye capa isCategory si coincide con la seleccionada', () => {
        setContext({ activeLayerIds: ['capa-a', 'grupo'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({
            activeLayerIds: ['capa-a', 'grupo'],
            selectedLayerForSymbology: { id: 'grupo' }
        });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.get('layers')).toBe('capa-a,*grupo');
    });

    it('escribe filter_<id> con un solo filtro', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({
            activeLayerIds: ['capa-a'],
            filters: { 'capa-a': { date: "fecha='2024-01-01'" } }
        });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.get('filter_capa-a')).toBe("fecha='2024-01-01'");
    });

    it('combina múltiples filtros con AND y paréntesis', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({
            activeLayerIds: ['capa-a'],
            filters: {
                'capa-a': {
                    date: "fecha='2024-01-01'",
                    municipio: "municipio='GDL'"
                }
            }
        });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        const combined = result.get('filter_capa-a');
        expect(combined).toContain("(fecha='2024-01-01')");
        expect(combined).toContain("(municipio='GDL')");
        expect(combined).toContain(' AND ');
    });

    it('ignora claves de filtros que empiezan con _', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({
            activeLayerIds: ['capa-a'],
            filters: { 'capa-a': { _interno: 'oculto', visible: "tipo='A'" } }
        });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.get('filter_capa-a')).toBe("tipo='A'");
    });

    it('omite filter_<id> cuando solo hay claves _', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({
            activeLayerIds: ['capa-a'],
            filters: { 'capa-a': { _interno: 'oculto' } }
        });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const result = updater(new URLSearchParams());
        expect(result.has('filter_capa-a')).toBe(false);
    });
});

describe('useUrlSync - limpieza de parámetros previos', () => {
    it('elimina layers, filter_*, swap_* y selected previos antes de escribir', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({ activeLayerIds: ['capa-b'] });
        rerender();

        const [updater] = mockSetSearchParams.mock.calls[0];
        const prev = new URLSearchParams();
        prev.set('layers', 'capa-vieja');
        prev.set('filter_vieja', 'x=1');
        prev.set('swap_algo', 'y=2');
        prev.set('selected', 'z');
        prev.set('zoom', '10');
        const result = updater(prev);
        expect(result.get('layers')).toBe('capa-b');
        expect(result.has('filter_vieja')).toBe(false);
        expect(result.has('swap_algo')).toBe(false);
        expect(result.has('selected')).toBe(false);
        expect(result.get('zoom')).toBe('10');
    });
});

describe('useUrlSync - no-op cuando nada cambia', () => {
    it('no llama a setSearchParams si rerenderea con el mismo estado', () => {
        setContext({ activeLayerIds: ['capa-a'] });
        const { rerender } = renderHook(() => useUrlSync());

        setContext({ activeLayerIds: ['capa-a', 'capa-b'] });
        rerender();
        expect(mockSetSearchParams).toHaveBeenCalledTimes(1);

        rerender();
        expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    });
});
