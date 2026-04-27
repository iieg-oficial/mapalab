import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useLoadMoreFeatures } from '@hooksMaps/useLoadMoreFeatures';

const buildResults = (layerId, visibleCount, totalAvailable) => {
    const cache = Array.from({ length: totalAvailable }, (_, i) => ({
        id: `${layerId}.${i}`,
        properties: { idx: i }
    }));
    return [{
        layerId,
        layerName: 'Capa X',
        features: cache.slice(0, visibleCount),
        cachedFeatures: cache,
        totalAvailable,
        totalFeatures: visibleCount,
        displayCap: visibleCount,
    }];
};

describe('useLoadMoreFeatures', () => {
    it('avanza la pagina sliceando del cache local sin red', async () => {
        const setSelectedFeatureInfo = vi.fn();
        const selectedFeatureInfo = { results: buildResults('layer1', 50, 200) };

        const { result } = renderHook(() => useLoadMoreFeatures(selectedFeatureInfo, setSelectedFeatureInfo));
        const added = await result.current('layer1', 50);

        expect(added).toBe(50);
        expect(setSelectedFeatureInfo).toHaveBeenCalledTimes(1);

        const updater = setSelectedFeatureInfo.mock.calls[0][0];
        const updated = updater({ results: buildResults('layer1', 50, 200) });
        expect(updated.results[0].features.length).toBe(100);
        expect(updated.results[0].displayCap).toBe(100);
    });

    it('retorna 0 si no hay layer matcheado', async () => {
        const setSelectedFeatureInfo = vi.fn();
        const selectedFeatureInfo = { results: buildResults('otra', 50, 200) };

        const { result } = renderHook(() => useLoadMoreFeatures(selectedFeatureInfo, setSelectedFeatureInfo));
        const added = await result.current('layer1', 50);

        expect(added).toBe(0);
        expect(setSelectedFeatureInfo).not.toHaveBeenCalled();
    });

    it('retorna 0 cuando ya se alcanzo el total', async () => {
        const setSelectedFeatureInfo = vi.fn();
        const selectedFeatureInfo = { results: buildResults('layer1', 200, 200) };

        const { result } = renderHook(() => useLoadMoreFeatures(selectedFeatureInfo, setSelectedFeatureInfo));
        const added = await result.current('layer1', 50);

        expect(added).toBe(0);
        expect(setSelectedFeatureInfo).not.toHaveBeenCalled();
    });

    it('respeta totalAvailable como cap superior', async () => {
        const setSelectedFeatureInfo = vi.fn();
        const selectedFeatureInfo = { results: buildResults('layer1', 180, 200) };

        const { result } = renderHook(() => useLoadMoreFeatures(selectedFeatureInfo, setSelectedFeatureInfo));
        const added = await result.current('layer1', 50);

        expect(added).toBe(20);
    });
});
