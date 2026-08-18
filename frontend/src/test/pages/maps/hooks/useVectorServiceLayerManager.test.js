import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const {
    mockFindWMSConfig,
    mockFindLayerDef,
    mockCount,
    mockFetch,
    mockSetLayerLoading
} = vi.hoisted(() => ({
    mockFindWMSConfig: vi.fn(),
    mockFindLayerDef: vi.fn(),
    mockCount: vi.fn(),
    mockFetch: vi.fn(),
    mockSetLayerLoading: vi.fn()
}));

vi.mock('@pages/maps/helpers/wmsConfig', () => ({
    findWMSConfig: (...args) => mockFindWMSConfig(...args),
    findLayerDef: (...args) => mockFindLayerDef(...args)
}));

vi.mock('@services/vectorLayerService', () => ({
    VECTOR_PROJECTION: 'EPSG:3857',
    countVectorFeatures: (...args) => mockCount(...args),
    fetchVectorFeatures: (...args) => mockFetch(...args)
}));

vi.mock('@services/hexbinAggregateService', () => ({
    nearestPrecomputed: (r) => (r >= 3 && r <= 8 ? r : 8),
    fetchAggregatedCells: () => Promise.resolve(null)
}));

vi.mock('@hooks/useLayers', () => ({ useLayers: () => ({ layers: [] }) }));
vi.mock('@hooks/useDebounce', () => ({ useDebounce: (value) => value }));
vi.mock('@hooks/useLayerLoading', () => ({
    useLayerLoading: () => ({ setLayerLoading: mockSetLayerLoading })
}));

import { useVectorServiceLayerManager } from '@hooksMaps/useVectorServiceLayerManager';
import { SERVICE_HEXBIN, SERVICE_VECTOR } from '@pages/maps/helpers/serviceMode';

const makeMapRef = () => ({
    current: {
        addLayer: vi.fn(),
        removeLayer: vi.fn(),
        on: vi.fn(),
        un: vi.fn(),
        getView: () => ({ getZoom: () => 8 })
    }
});

const MISMA_TABLA = {
    baseUrl: 'http://gs/salud/wms',
    layerName: 'salud:unidades_salud',
    wfsAvailable: true
};

const render = (vectorModes, activeLayerIds) => {
    const mapRef = makeMapRef();
    const hook = renderHook(() => useVectorServiceLayerManager({
        mapRef,
        activeLayerIds,
        hiddenLayerIds: [],
        vectorModes,
        getFilter: (id) => `institucion = '${id}'`,
        combineCQLFilters: (base, dyn) => dyn || base || null,
        getLayerOpacity: () => 1,
        layerOpacities: {}
    }));
    return { ...hook, mapRef };
};

beforeEach(() => {
    vi.clearAllMocks();
    mockFindWMSConfig.mockReturnValue(MISMA_TABLA);
    mockFindLayerDef.mockReturnValue({ geometryType: 'point' });
    mockCount.mockResolvedValue(10);
    mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [] });
});

describe('useVectorServiceLayerManager - una petición por tabla', () => {
    it('agrupa los hijos de la misma tabla en una sola petición', async () => {
        const modes = new Map([
            ['hijo_a', SERVICE_HEXBIN],
            ['hijo_b', SERVICE_HEXBIN],
            ['hijo_c', SERVICE_HEXBIN]
        ]);

        const { mapRef } = render(modes, ['hijo_a', 'hijo_b', 'hijo_c']);

        expect(mockCount).toHaveBeenCalledTimes(1);
        expect(mapRef.current.addLayer).toHaveBeenCalledTimes(1);
    });

    it('une los filtros de los hijos con OR', () => {
        const modes = new Map([['hijo_a', SERVICE_HEXBIN], ['hijo_b', SERVICE_HEXBIN]]);
        render(modes, ['hijo_a', 'hijo_b']);

        const cql = mockCount.mock.calls[0][1];
        expect(cql).toContain(' OR ');
        expect(cql).toContain("institucion = 'hijo_a'");
        expect(cql).toContain("institucion = 'hijo_b'");
    });

    it('separa las tablas distintas', () => {
        mockFindWMSConfig.mockImplementation((id) => ({
            ...MISMA_TABLA,
            layerName: id === 'otra' ? 'educacion:centros' : 'salud:unidades_salud'
        }));

        const modes = new Map([['hijo_a', SERVICE_HEXBIN], ['otra', SERVICE_HEXBIN]]);
        render(modes, ['hijo_a', 'otra']);

        expect(mockCount).toHaveBeenCalledTimes(2);
    });

    it('no mezcla la misma tabla en dos modos distintos', () => {
        const modes = new Map([['hijo_a', SERVICE_HEXBIN], ['hijo_b', SERVICE_VECTOR]]);
        render(modes, ['hijo_a', 'hijo_b']);

        expect(mockCount).toHaveBeenCalledTimes(2);
    });

    it('marca cargando a todos los hijos, no solo al primero', () => {
        const modes = new Map([['hijo_a', SERVICE_HEXBIN], ['hijo_b', SERVICE_HEXBIN]]);
        render(modes, ['hijo_a', 'hijo_b']);

        const marcados = mockSetLayerLoading.mock.calls.filter(([, on]) => on === true).map(([id]) => id);
        expect(marcados).toEqual(expect.arrayContaining(['hijo_a', 'hijo_b']));
    });
});
