import { describe, it, expect, vi } from 'vitest';
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

import { useShareSerializer } from '@hooksMaps/useShareSerializer';

const TREE = [
    { id: 'tema_salud', nodeType: 'tema', label: 'Salud', children: [
        { id: 'establecimientos_salud', slug: 'establecimientos-salud', label: 'Estab', nodeType: 'leaf' },
        { id: 'imss_1', slug: 'imss', label: 'IMSS', nodeType: 'leaf' },
    ]},
];

const baseCtx = (overrides = {}) => ({
    activeLayerIds: ['establecimientos_salud', 'imss_1'],
    hiddenLayerIds: [],
    layerOpacities: {},
    filters: {},
    selectedLayerForSymbology: null,
    baseMapId: 'osm',
    dateLoops: {},
    loopPrefs: {},
    mapRef: {
        current: {
            getView: () => ({
                getCenter: () => [-11500000, 2300000], // EPSG:3857
                getZoom: () => 12,
                getRotation: () => 0,
            }),
        },
    },
    ...overrides,
});

describe('useShareSerializer', () => {
    it('captura selected como slug cuando selectedLayerForSymbology esta definido', () => {
        mockUseLayers.mockReturnValue({ layers: TREE });
        mockUseMapsContext.mockReturnValue(baseCtx({
            selectedLayerForSymbology: { id: 'establecimientos_salud', name: 'Estab' },
        }));

        const { result } = renderHook(() => useShareSerializer());
        const envelope = result.current('single');

        expect(envelope.payload.selected).toBe('establecimientos-salud');
    });

    it('selected es null cuando no hay seleccion', () => {
        mockUseLayers.mockReturnValue({ layers: TREE });
        mockUseMapsContext.mockReturnValue(baseCtx({
            selectedLayerForSymbology: null,
        }));

        const { result } = renderHook(() => useShareSerializer());
        const envelope = result.current('single');

        expect(envelope.payload.selected).toBe(null);
    });

    it('cae al id si la capa no tiene slug', () => {
        const treeNoSlug = [
            { id: 'tema_x', nodeType: 'tema', children: [
                { id: 'capa_sin_slug', label: 'X', nodeType: 'leaf' }
            ]}
        ];
        mockUseLayers.mockReturnValue({ layers: treeNoSlug });
        mockUseMapsContext.mockReturnValue(baseCtx({
            activeLayerIds: ['capa_sin_slug'],
            selectedLayerForSymbology: { id: 'capa_sin_slug', name: 'X' },
        }));

        const { result } = renderHook(() => useShareSerializer());
        const envelope = result.current('single');

        expect(envelope.payload.selected).toBe('capa_sin_slug');
    });

    it('view se serializa en WGS84 (lon/lat) no en EPSG:3857', () => {
        mockUseLayers.mockReturnValue({ layers: TREE });
        mockUseMapsContext.mockReturnValue(baseCtx());

        const { result } = renderHook(() => useShareSerializer());
        const envelope = result.current('single');

        // [-11500000, 2300000] EPSG:3857 ≈ [-103.3, 20.6] WGS84
        expect(envelope.payload.view.lon).toBeGreaterThan(-105);
        expect(envelope.payload.view.lon).toBeLessThan(-102);
        expect(envelope.payload.view.lat).toBeGreaterThan(20);
        expect(envelope.payload.view.lat).toBeLessThan(22);
    });
});
