import { useState, useRef, useEffect, useCallback } from 'react';

const DOWNLOAD_HARD_CAP = 5000;

export const useInfoBoxLazyLoad = ({ results, isPolygonSelection, loadMoreFeatures }) => {
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef(null);

    const totalAvailable = results
        ? results.reduce((sum, r) => sum + (r.totalAvailable ?? r.features.length), 0)
        : 0;
    const totalFeatures = results
        ? results.reduce((sum, r) => sum + r.features.length, 0)
        : 0;
    const hasMoreKnown = !isPolygonSelection && totalAvailable > totalFeatures;
    const cappedAtFetchLimit = !!results && !isPolygonSelection
        && results.some((r) => r.cappedAtLimit);
    const canLoadMore = hasMoreKnown;
    const showCountIndicator = canLoadMore || cappedAtFetchLimit;
    const layerWithMore = canLoadMore && results
        ? results.find((r) => (r.totalAvailable ?? r.features.length) > r.features.length)
        : null;
    const layerWithMoreId = layerWithMore?.layerId;
    const layerWithMoreLoaded = layerWithMore?.features.length;

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !layerWithMoreId || loadingMore) return;

        let root = sentinel.parentElement;
        while (root && root !== document.body) {
            const overflow = getComputedStyle(root).overflowY;
            if (overflow === 'auto' || overflow === 'scroll') break;
            root = root.parentElement;
        }
        const observerRoot = root && root !== document.body ? root : null;

        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0];
            if (!entry?.isIntersecting) return;
            setLoadingMore(true);
            try {
                await loadMoreFeatures(layerWithMoreId, 50);
            } finally {
                setLoadingMore(false);
            }
        }, { root: observerRoot, rootMargin: '120px', threshold: 0 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [layerWithMoreId, layerWithMoreLoaded, loadingMore, loadMoreFeatures]);

    const enrichResultsForDownload = useCallback(async () => {
        if (!results || results.length === 0) return [];
        return results.map((r) => {
            const cache = r.cachedFeatures || r.features;
            return { ...r, features: cache.slice(0, DOWNLOAD_HARD_CAP) };
        });
    }, [results]);

    const downloadDisplayCount = Math.min(totalAvailable, DOWNLOAD_HARD_CAP);
    const downloadShowsPlus = cappedAtFetchLimit;
    const downloadTooltipText = downloadShowsPlus
        ? `Descargar ${downloadDisplayCount}+ tarjetas (cap consulta ${totalAvailable})`
        : (canLoadMore
            ? `Descargar ${downloadDisplayCount} de ${totalAvailable} tarjetas (cap ${DOWNLOAD_HARD_CAP})`
            : `Descargar ${downloadDisplayCount} ${downloadDisplayCount === 1 ? 'tarjeta' : 'tarjetas'}`);

    return {
        sentinelRef,
        loadingMore,
        totalAvailable,
        totalFeatures,
        hasMore: canLoadMore,
        hasMoreKnown,
        hasMoreUnknown: cappedAtFetchLimit,
        showCountIndicator,
        downloadDisplayCount,
        downloadShowsPlus,
        downloadTooltipText,
        enrichResultsForDownload,
    };
};
