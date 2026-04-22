import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockUseMapsContext, mockSearchParams } = vi.hoisted(() => ({
    mockUseMapsContext: vi.fn(),
    mockSearchParams: { current: new URLSearchParams() }
}));

vi.mock('react-router', () => ({
    useSearchParams: () => [mockSearchParams.current, vi.fn()]
}));

vi.mock('@hooks/useMaps', () => ({
    useMapsContext: () => mockUseMapsContext()
}));

vi.mock('@pages/maps/helpers/layers/definitions/base', () => ({
    BASE_INITIAL_ORDER: ['base-1', 'base-2']
}));

import { useInitializeFromUrl, filtersInitializationComplete } from '@hooksMaps/useInitializeFromUrl';

const makeCtx = (overrides = {}) => ({
    setActiveLayerIds: vi.fn(),
    getAllChildLayerIds: vi.fn(() => []),
    applyFilter: vi.fn(),
    applyDefaultDate: vi.fn(),
    setSelectedLayerForSymbology: vi.fn(),
    findLayerById: vi.fn((id) => ({ id })),
    ...overrides
});

const setUrl = (query) => {
    mockSearchParams.current = new URLSearchParams(query);
};

beforeEach(() => {
    vi.clearAllMocks();
    filtersInitializationComplete.value = false;
    setUrl('');
});

describe('useInitializeFromUrl - con parámetro layers', () => {
    it('activa las capas listadas en ?layers', () => {
        setUrl('layers=capa-a,capa-b');
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setActiveLayerIds).toHaveBeenCalledWith(['capa-a', 'capa-b']);
    });

    it('expande hijos con getAllChildLayerIds', () => {
        setUrl('layers=grupo');
        const ctx = makeCtx({
            getAllChildLayerIds: vi.fn((id) => id === 'grupo' ? ['hijo-1', 'hijo-2'] : [])
        });
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setActiveLayerIds).toHaveBeenCalledWith(['grupo', 'hijo-1', 'hijo-2']);
    });

    it('no duplica ids en la expansión', () => {
        setUrl('layers=grupo,hijo-1');
        const ctx = makeCtx({
            getAllChildLayerIds: vi.fn((id) => id === 'grupo' ? ['hijo-1', 'hijo-2'] : [])
        });
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        const [allIds] = ctx.setActiveLayerIds.mock.calls[0];
        expect(allIds.filter(id => id === 'hijo-1')).toHaveLength(1);
    });

    it('ignora ids vacíos en la lista', () => {
        setUrl('layers=capa-a,,capa-b,   ');
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setActiveLayerIds).toHaveBeenCalledWith(['capa-a', 'capa-b']);
    });
});

describe('useInitializeFromUrl - selección con prefijo *', () => {
    it('marca la capa con * como seleccionada para simbología', () => {
        setUrl('layers=capa-a,*seleccionada');
        const layer = { id: 'seleccionada', name: 'X' };
        const ctx = makeCtx({ findLayerById: vi.fn(() => layer) });
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.findLayerById).toHaveBeenCalledWith('seleccionada');
        expect(ctx.setSelectedLayerForSymbology).toHaveBeenCalledWith(layer);
    });

    it('activa la capa seleccionada sin el prefijo *', () => {
        setUrl('layers=*seleccionada');
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setActiveLayerIds).toHaveBeenCalledWith(['seleccionada']);
    });

    it('no marca nada para simbología si no hay *', () => {
        setUrl('layers=capa-a');
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setSelectedLayerForSymbology).not.toHaveBeenCalled();
    });

    it('no llama a setSelectedLayerForSymbology si findLayerById retorna null', () => {
        setUrl('layers=*inexistente');
        const ctx = makeCtx({ findLayerById: vi.fn(() => null) });
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setSelectedLayerForSymbology).not.toHaveBeenCalled();
    });
});

describe('useInitializeFromUrl - filtros en URL', () => {
    it('aplica applyFilter con el valor de filter_<id>', () => {
        setUrl('layers=capa-a&filter_capa-a=' + encodeURIComponent("fecha='2024-01-01'"));
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.applyFilter).toHaveBeenCalledWith('capa-a', 'date', "fecha='2024-01-01'");
    });

    it('aplica applyDefaultDate a capas sin filter en URL', () => {
        setUrl('layers=capa-a,capa-b&filter_capa-a=' + encodeURIComponent("fecha='2024-01-01'"));
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.applyDefaultDate).toHaveBeenCalledWith('capa-b');
        expect(ctx.applyDefaultDate).not.toHaveBeenCalledWith('capa-a');
    });

    it('el filtro de URL tiene precedencia sobre applyDefaultDate', () => {
        setUrl('layers=capa-a&filter_capa-a=cql-de-url');
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.applyDefaultDate).not.toHaveBeenCalledWith('capa-a');
        expect(ctx.applyFilter).toHaveBeenCalledWith('capa-a', 'date', 'cql-de-url');
    });
});

describe('useInitializeFromUrl - sin parámetro layers', () => {
    it('activa BASE_INITIAL_ORDER cuando la URL está vacía', () => {
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setActiveLayerIds).toHaveBeenCalledWith(['base-1', 'base-2']);
    });

    it('expande hijos de BASE_INITIAL_ORDER', () => {
        const ctx = makeCtx({
            getAllChildLayerIds: vi.fn((id) => id === 'base-1' ? ['hijo-base'] : [])
        });
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.setActiveLayerIds).toHaveBeenCalledWith(['base-1', 'hijo-base', 'base-2']);
    });

    it('aplica applyDefaultDate a las capas base', () => {
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.applyDefaultDate).toHaveBeenCalledWith('base-1');
        expect(ctx.applyDefaultDate).toHaveBeenCalledWith('base-2');
    });

    it('respeta filtros en URL incluso sin ?layers', () => {
        setUrl('filter_base-1=cql');
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        renderHook(() => useInitializeFromUrl());

        expect(ctx.applyFilter).toHaveBeenCalledWith('base-1', 'date', 'cql');
        expect(ctx.applyDefaultDate).not.toHaveBeenCalledWith('base-1');
    });
});

describe('useInitializeFromUrl - guards', () => {
    it('marca filtersInitializationComplete.value = true al terminar', () => {
        setUrl('layers=capa-a');
        mockUseMapsContext.mockReturnValue(makeCtx());

        renderHook(() => useInitializeFromUrl());

        expect(filtersInitializationComplete.value).toBe(true);
    });

    it('no corre dos veces aunque se rerendee', () => {
        setUrl('layers=capa-a');
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);

        const { rerender } = renderHook(() => useInitializeFromUrl());
        rerender();
        rerender();

        expect(ctx.setActiveLayerIds).toHaveBeenCalledTimes(1);
    });

    it('no corre si setActiveLayerIds es undefined', () => {
        setUrl('layers=capa-a');
        mockUseMapsContext.mockReturnValue(makeCtx({ setActiveLayerIds: undefined, applyFilter: vi.fn() }));

        renderHook(() => useInitializeFromUrl());

        expect(filtersInitializationComplete.value).toBe(false);
    });

    it('no corre si applyFilter es undefined', () => {
        setUrl('layers=capa-a');
        mockUseMapsContext.mockReturnValue(makeCtx({ applyFilter: undefined }));

        renderHook(() => useInitializeFromUrl());

        expect(filtersInitializationComplete.value).toBe(false);
    });
});
