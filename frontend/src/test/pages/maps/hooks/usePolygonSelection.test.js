import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';

import { usePolygonSelection } from '@hooksMaps/usePolygonSelection';
import { useLoadMorePolygonFeatures } from '@hooksMaps/useLoadMorePolygonFeatures';

vi.mock('@services/featureInfoService', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, getFeaturesInPolygonForActiveLayers: vi.fn() };
});

const { getFeaturesInPolygonForActiveLayers } = await import('@services/featureInfoService');

const buildPage = (startIndex, matched, size = 200) => ({
    results: [{
        layerId: 'capa1',
        layerName: 'Capa 1',
        features: Array.from({ length: size }, (_, i) => ({ id: `capa1.${startIndex + i}` })),
        totalFeatures: size
    }],
    matched,
    returned: size,
    nextIndex: startIndex + size,
    hasMore: startIndex + size < matched
});

const activeLayers = [{ id: 'capa1', name: 'Capa 1', visible: true }];
const queryArgs = { map: {}, polygonGeometry: {}, activeLayers, allLayers: [], isInegiMode: false };

describe('usePolygonSelection', () => {
    beforeEach(() => {
        getFeaturesInPolygonForActiveLayers.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('guarda el estado de paginacion tras la primera consulta', async () => {
        getFeaturesInPolygonForActiveLayers.mockResolvedValue(buildPage(0, 285));

        const { result } = renderHook(() => usePolygonSelection({ getFilter: null }));
        const page = await result.current.queryPolygon(queryArgs);

        expect(page.matched).toBe(285);
        expect(result.current.polygonPageRef.current.nextIndex).toBe(200);
        expect(result.current.polygonPageRef.current.hasMore).toBe(true);
    });

    it('pide la siguiente pagina desde el nextIndex guardado', async () => {
        getFeaturesInPolygonForActiveLayers
            .mockResolvedValueOnce(buildPage(0, 285))
            .mockResolvedValueOnce(buildPage(200, 285, 85));

        const { result } = renderHook(() => usePolygonSelection({ getFilter: null }));
        await result.current.queryPolygon(queryArgs);
        const page = await result.current.loadMorePage();

        expect(page.results[0].features).toHaveLength(85);
        expect(getFeaturesInPolygonForActiveLayers.mock.calls[1][6]).toEqual({ startIndex: 200 });
        expect(result.current.polygonPageRef.current.hasMore).toBe(false);
    });

    it('corta la paginacion si el servidor rechaza la siguiente pagina', async () => {
        getFeaturesInPolygonForActiveLayers
            .mockResolvedValueOnce(buildPage(0, 285))
            .mockRejectedValueOnce(new Error('HTTP error! status: 400'));

        const { result } = renderHook(() => usePolygonSelection({ getFilter: null }));
        await result.current.queryPolygon(queryArgs);
        const page = await result.current.loadMorePage();

        expect(page).toBeNull();
        expect(result.current.polygonPageRef.current.hasMore).toBe(false);
    });

    it('comparte el estado de paginacion entre dos consumidores del mismo ref', async () => {
        getFeaturesInPolygonForActiveLayers
            .mockResolvedValueOnce(buildPage(0, 285))
            .mockResolvedValueOnce(buildPage(200, 285, 85));

        const { result } = renderHook(() => {
            const pageRef = useRef(null);
            return {
                consulta: usePolygonSelection({ getFilter: null, pageRef }),
                infobox: usePolygonSelection({ getFilter: null, pageRef })
            };
        });

        await result.current.consulta.queryPolygon(queryArgs);
        const page = await result.current.infobox.loadMorePage();

        expect(page).not.toBeNull();
        expect(page.results[0].features).toHaveLength(85);
    });
});

describe('useLoadMorePolygonFeatures', () => {
    beforeEach(() => {
        getFeaturesInPolygonForActiveLayers.mockReset();
    });

    it('acumula las features de la pagina nueva sobre las ya visibles', async () => {
        getFeaturesInPolygonForActiveLayers.mockResolvedValue(buildPage(200, 285, 85));
        const setSelectedFeatureInfo = vi.fn();
        const pageRef = { current: { activeLayers, map: {}, polygonGeometry: {}, allLayers: [], isInegiMode: false, nextIndex: 200, hasMore: true, matched: 285 } };

        const { result } = renderHook(() => useLoadMorePolygonFeatures(pageRef, null, setSelectedFeatureInfo));
        const added = await result.current();

        expect(added).toBe(85);
        const updater = setSelectedFeatureInfo.mock.calls[0][0];
        const updated = updater({ results: [{ layerId: 'capa1', layerName: 'Capa 1', features: Array.from({ length: 200 }, (_, i) => ({ id: `capa1.${i}` })) }] });
        expect(updated.results[0].features).toHaveLength(285);
        expect(updated.hasMore).toBe(false);
    });

    it('marca hasMore en falso cuando la pagina siguiente falla', async () => {
        getFeaturesInPolygonForActiveLayers.mockRejectedValue(new Error('HTTP error! status: 400'));
        const setSelectedFeatureInfo = vi.fn();
        const pageRef = { current: { activeLayers, map: {}, polygonGeometry: {}, allLayers: [], isInegiMode: false, nextIndex: 200, hasMore: true, matched: 285 } };

        const { result } = renderHook(() => useLoadMorePolygonFeatures(pageRef, null, setSelectedFeatureInfo));
        const added = await result.current();

        expect(added).toBe(0);
        const updater = setSelectedFeatureInfo.mock.calls[0][0];
        expect(updater({ results: [{ layerId: 'capa1', features: [] }] }).hasMore).toBe(false);
    });
});
