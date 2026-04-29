import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockUseMapsContext, mockUseLayers } = vi.hoisted(() => ({
    mockUseMapsContext: vi.fn(),
    mockUseLayers: vi.fn(),
}));

vi.mock('@hooks/useMaps', () => ({
    useMapsContext: () => mockUseMapsContext(),
}));

vi.mock('@hooks/useLayers', () => ({
    useLayers: () => mockUseLayers(),
}));

import { useShareDeserializer } from '@hooksMaps/useShareDeserializer';

const TREE = [
    { id: 'tema_salud', nodeType: 'tema', label: 'Salud', children: [
        { id: 'establecimientos_salud', slug: 'establecimientos-salud', label: 'Establecimientos', nodeType: 'leaf' }
    ]},
    { id: 'tema_carreteras', nodeType: 'tema', label: 'Carreteras', children: [
        { id: 'carreteras_estatales', slug: 'carreteras-estatales', label: 'Estatales', nodeType: 'leaf', aliases: ['carreteras'] }
    ]}
];

const makeCtx = (overrides = {}) => ({
    setActiveLayerIds: vi.fn(),
    getAllChildLayerIds: vi.fn(() => []),
    applyFilter: vi.fn(),
    setSelectedLayerForSymbology: vi.fn(),
    findLayerById: vi.fn((id) => TREE.flatMap(t => t.children).find(l => l.id === id)),
    setLayerOpacity: vi.fn(),
    setHiddenLayerIds: vi.fn(),
    setBaseMapId: vi.fn(),
    setCompareMode: vi.fn(),
    mapRef: { current: null },
    ...overrides,
});

describe('useShareDeserializer', () => {
    beforeEach(() => {
        mockUseLayers.mockReturnValue({ layers: TREE });
    });

    it('rechaza envelopes con version distinta a 1', () => {
        mockUseMapsContext.mockReturnValue(makeCtx());
        const { result } = renderHook(() => useShareDeserializer());
        expect(result.current({ version: 2, kind: 'single', payload: {} })).toBe(false);
    });

    it('rechaza envelopes con kind desconocido', () => {
        mockUseMapsContext.mockReturnValue(makeCtx());
        const { result } = renderHook(() => useShareDeserializer());
        expect(result.current({ version: 1, kind: 'whatever', payload: {} })).toBe(false);
    });

    it('rechaza envelopes con kind:"compare" (legacy eliminado)', () => {
        mockUseMapsContext.mockReturnValue(makeCtx());
        const { result } = renderHook(() => useShareDeserializer());
        expect(result.current({
            version: 1,
            kind: 'compare',
            payload: {
                base: { layers: [] },
                axis: 'date',
                panes: [
                    { value: '2020-01-01', label: 'Antes' },
                    { value: '2024-01-01', label: 'Despues' },
                ],
            },
        })).toBe(false);
    });

    it('acepta envelopes kind:"swipe" con position', () => {
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);
        const { result } = renderHook(() => useShareDeserializer());
        const ok = result.current({
            version: 1,
            kind: 'swipe',
            payload: {
                base: { layers: [{ slug: 'establecimientos-salud', visible: true, opacity: 1, filters: {} }] },
                axis: 'date',
                panes: [
                    { value: '2020-01-01', label: 'A' },
                    { value: '2024-01-01', label: 'B' },
                ],
                position: 0.7,
            },
        });
        expect(ok).toBe(true);
        expect(ctx.setCompareMode).toHaveBeenCalledWith({
            active: true,
            axis: 'date',
            panes: [
                { value: '2020-01-01', label: 'A' },
                { value: '2024-01-01', label: 'B' },
            ],
            swipePosition: 0.7,
        });
    });

    it('resuelve slugs y aliases a layer ids reales', () => {
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);
        const { result } = renderHook(() => useShareDeserializer());

        result.current({
            version: 1,
            kind: 'single',
            payload: {
                layers: [
                    { slug: 'establecimientos-salud', visible: true, opacity: 1, filters: {} },
                    { slug: 'carreteras', visible: true, opacity: 0.5, filters: {} }
                ]
            }
        });

        expect(ctx.setActiveLayerIds).toHaveBeenCalledWith(
            expect.arrayContaining(['establecimientos_salud', 'carreteras_estatales'])
        );
    });

    it('aplica opacity y hidden por capa', () => {
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);
        const { result } = renderHook(() => useShareDeserializer());

        result.current({
            version: 1,
            kind: 'single',
            payload: {
                layers: [
                    { slug: 'establecimientos-salud', visible: false, opacity: 0.3, filters: {} }
                ]
            }
        });

        expect(ctx.setHiddenLayerIds).toHaveBeenCalledWith(['establecimientos_salud']);
        expect(ctx.setLayerOpacity).toHaveBeenCalledWith('establecimientos_salud', 0.3);
    });

    it('aplica filtros sin transformar el CQL', () => {
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);
        const { result } = renderHook(() => useShareDeserializer());

        const filterCql = "(fecha >= '2020-01-01' AND fecha < '2024-01-01')";
        result.current({
            version: 1,
            kind: 'single',
            payload: {
                layers: [
                    { slug: 'establecimientos-salud', filters: { date: filterCql } }
                ]
            }
        });

        expect(ctx.applyFilter).toHaveBeenCalledWith('establecimientos_salud', 'date', filterCql);
    });

    it('aplica view (lat/lon/zoom/rotation) cuando mapRef esta disponible', () => {
        const setCenter = vi.fn();
        const setZoom = vi.fn();
        const setRotation = vi.fn();
        const ctx = makeCtx({
            mapRef: {
                current: {
                    getView: () => ({ setCenter, setZoom, setRotation })
                }
            }
        });
        mockUseMapsContext.mockReturnValue(ctx);
        const { result } = renderHook(() => useShareDeserializer());

        result.current({
            version: 1,
            kind: 'single',
            payload: {
                layers: [],
                view: { lon: -103.34, lat: 20.65, zoom: 12.5, rotation: 0 }
            }
        });

        expect(setCenter).toHaveBeenCalled();
        expect(setZoom).toHaveBeenCalledWith(12.5);
        expect(setRotation).toHaveBeenCalledWith(0);
    });

    it('no truena si mapRef.current es null', () => {
        const ctx = makeCtx({ mapRef: { current: null } });
        mockUseMapsContext.mockReturnValue(ctx);
        const { result } = renderHook(() => useShareDeserializer());

        expect(() => result.current({
            version: 1,
            kind: 'single',
            payload: { layers: [], view: { lon: -103, lat: 20, zoom: 12 } }
        })).not.toThrow();
    });

    it('ignora capas con slug que no resuelven en el arbol', () => {
        const ctx = makeCtx();
        mockUseMapsContext.mockReturnValue(ctx);
        const { result } = renderHook(() => useShareDeserializer());

        result.current({
            version: 1,
            kind: 'single',
            payload: {
                layers: [
                    { slug: 'inexistente', visible: true, opacity: 1, filters: {} },
                    { slug: 'establecimientos-salud', visible: true, opacity: 1, filters: {} }
                ]
            }
        });

        const ids = ctx.setActiveLayerIds.mock.calls[0][0];
        expect(ids).toContain('establecimientos_salud');
        expect(ids).not.toContain('inexistente');
    });
});
