import { useCallback, useRef, useState } from 'react';
import {
    SWIPE_ORIGINAL_STORAGE_KEY,
    SWIPE_POS_MIN,
    SWIPE_POS_MAX,
    SWIPE_HIGHLIGHT_MS,
    SNAPSHOT_MAX_BYTES,
    emptyPane,
    initialCompareMode,
    serializeSnapshotForStorage,
    deserializeSnapshotFromStorage,
    purgePane,
    addIdsToPane,
    computeGlobalOrder,
    snapshotFromLive,
    persistOrientation,
    safeStructuredClone,
} from '@pages/maps/helpers/swipeMode';
import { trackSwipeEnter, trackSwipeExit } from '@services/analyticsService';

export const useSwipeMode = ({ liveStateRef, getAllChildLayerIds, paneMapRefs, mapRef }) => {
    const [compareMode, setCompareMode] = useState(initialCompareMode);
    const [highlightedSlots, setHighlightedSlots] = useState(null);
    const highlightTimerRef = useRef(null);
    const enteredAtRef = useRef(null);

    const highlightSlots = useCallback((slots, { temporal = false } = {}) => {
        clearTimeout(highlightTimerRef.current);
        setHighlightedSlots(slots);
        if (slots && temporal) {
            highlightTimerRef.current = setTimeout(() => setHighlightedSlots(null), SWIPE_HIGHLIGHT_MS);
        }
    }, []);

    const snapshotLive = useCallback((label) => snapshotFromLive(liveStateRef.current, label), [liveStateRef]);

    const applySnapshotToLive = useCallback((snapshot) => {
        const live = liveStateRef.current;
        live.setActiveLayerIds(snapshot.activeLayerIds);
        live.setHiddenLayerIds(snapshot.hiddenLayerIds);
        live.setLayerOpacities(new Map(snapshot.layerOpacities));
        live.setFilters(safeStructuredClone(snapshot.filters));
    }, [liveStateRef]);

    const enterCompareMode = useCallback(() => {
        const current = snapshotLive('original');
        try { localStorage.removeItem(SWIPE_ORIGINAL_STORAGE_KEY); } catch { /* storage no disponible */ }
        try {
            const payload = JSON.stringify(serializeSnapshotForStorage(current));
            if (payload.length <= SNAPSHOT_MAX_BYTES) {
                localStorage.setItem(SWIPE_ORIGINAL_STORAGE_KEY, payload);
            }
        } catch { /* storage no disponible / quota */ }
        liveStateRef.current.pauseAllLoops();
        applySnapshotToLive(current);
        const mainMap = mapRef?.current;
        let capturedView = null;
        if (mainMap) {
            const view = mainMap.getView();
            capturedView = { center: view.getCenter(), zoom: view.getZoom() };
        }
        setCompareMode(prev => {
            enteredAtRef.current = Date.now();
            trackSwipeEnter(prev.swipeOrientation);
            return {
                ...initialCompareMode(),
                active: true,
                activeSlot: 'A',
                paneA: current,
                paneB: emptyPane('B'),
                originalSnapshot: current,
                swipeOrientation: prev.swipeOrientation,
                capturedView,
            };
        });
    }, [snapshotLive, applySnapshotToLive, liveStateRef, mapRef]);

    const setActiveSlot = useCallback((nextSlot) => {
        if (nextSlot !== 'A' && nextSlot !== 'B') return;
        setCompareMode(prev => {
            if (!prev.active || prev.activeSlot === nextSlot) return prev;
            const currentSnapshot = snapshotLive(prev[`pane${prev.activeSlot}`].label);
            const targetSnapshot = prev[`pane${nextSlot}`];
            applySnapshotToLive(targetSnapshot);
            return { ...prev, activeSlot: nextSlot, [`pane${prev.activeSlot}`]: currentSnapshot };
        });
    }, [snapshotLive, applySnapshotToLive]);

    const collectAllIds = useCallback((layerId) => {
        const childIds = getAllChildLayerIds?.(layerId) || [];
        return [layerId, ...childIds];
    }, [getAllChildLayerIds]);

    const purgeLiveOf = useCallback((idsSet) => {
        const live = liveStateRef.current;
        live.setActiveLayerIds(live.activeLayerIds.filter(id => !idsSet.has(id)));
        live.setHiddenLayerIds(live.hiddenLayerIds.filter(id => !idsSet.has(id)));
        const newOpacities = new Map(live.layerOpacities);
        idsSet.forEach(id => newOpacities.delete(id));
        live.setLayerOpacities(newOpacities);
        const newFilters = { ...live.filters };
        idsSet.forEach(id => { delete newFilters[id]; });
        live.setFilters(newFilters);
    }, [liveStateRef]);

    const removeLayerFromSlot = useCallback((layerId, slot) => {
        if (slot !== 'A' && slot !== 'B') return;
        const idsSet = new Set(collectAllIds(layerId));
        setCompareMode(prev => {
            if (!prev.active) return prev;
            const newPane = purgePane(prev[`pane${slot}`], idsSet);
            if (slot === prev.activeSlot) purgeLiveOf(idsSet);
            const otherSlot = slot === 'A' ? 'B' : 'A';
            const newGlobalOrder = computeGlobalOrder(
                prev.globalOrder,
                slot === 'A' ? newPane : prev.paneA,
                slot === 'B' ? newPane : prev.paneB,
            );
            return { ...prev, [`pane${slot}`]: newPane, globalOrder: newGlobalOrder, [`pane${otherSlot}`]: prev[`pane${otherSlot}`] };
        });
    }, [collectAllIds, purgeLiveOf]);

    const applyFilterToSlot = useCallback((layerId, slot, filterName, cqlExpression) => {
        if (slot !== 'A' && slot !== 'B') return;
        setCompareMode(prev => {
            if (!prev.active) return prev;
            const pane = prev[`pane${slot}`];
            const layerFilters = { ...(pane.filters[layerId] || {}), [filterName]: cqlExpression };
            const newFilters = { ...pane.filters, [layerId]: layerFilters };
            if (slot === prev.activeSlot) {
                const live = liveStateRef.current;
                const liveLayerFilters = { ...(live.filters[layerId] || {}), [filterName]: cqlExpression };
                live.setFilters({ ...live.filters, [layerId]: liveLayerFilters });
            }
            return { ...prev, [`pane${slot}`]: { ...pane, filters: newFilters } };
        });
    }, [liveStateRef]);

    const clearFilterFromSlot = useCallback((layerId, slot, filterName) => {
        if (slot !== 'A' && slot !== 'B') return;
        setCompareMode(prev => {
            if (!prev.active) return prev;
            const pane = prev[`pane${slot}`];
            const layerFilters = { ...(pane.filters[layerId] || {}) };
            delete layerFilters[filterName];
            const newFilters = { ...pane.filters };
            if (Object.keys(layerFilters).length === 0) delete newFilters[layerId];
            else newFilters[layerId] = layerFilters;
            if (slot === prev.activeSlot) {
                const live = liveStateRef.current;
                const liveLayerFilters = { ...(live.filters[layerId] || {}) };
                delete liveLayerFilters[filterName];
                const newLiveFilters = { ...live.filters };
                if (Object.keys(liveLayerFilters).length === 0) delete newLiveFilters[layerId];
                else newLiveFilters[layerId] = liveLayerFilters;
                live.setFilters(newLiveFilters);
            }
            return { ...prev, [`pane${slot}`]: { ...pane, filters: newFilters } };
        });
    }, [liveStateRef]);

    const toggleLayerVisibilityInSlot = useCallback((layerId, slot) => {
        if (slot !== 'A' && slot !== 'B') return;
        const allIds = collectAllIds(layerId);
        setCompareMode(prev => {
            if (!prev.active) return prev;
            const pane = prev[`pane${slot}`];
            const isHidden = pane.hiddenLayerIds.includes(layerId);
            const newHidden = isHidden
                ? pane.hiddenLayerIds.filter(id => !allIds.includes(id))
                : Array.from(new Set([...pane.hiddenLayerIds, ...allIds]));
            if (slot === prev.activeSlot) liveStateRef.current.setHiddenLayerIds(newHidden);
            return { ...prev, [`pane${slot}`]: { ...pane, hiddenLayerIds: newHidden } };
        });
    }, [collectAllIds, liveStateRef]);

    const setLayerSlotMembership = useCallback((layerId, target) => {
        if (target !== 'A' && target !== 'B' && target !== 'AB') return;
        const allIds = collectAllIds(layerId);
        const idsSet = new Set(allIds);
        setCompareMode(prev => {
            if (!prev.active) return prev;
            const inA = prev.paneA.activeLayerIds.includes(layerId);
            const inB = prev.paneB.activeLayerIds.includes(layerId);
            const wantInA = target === 'A' || target === 'AB';
            const wantInB = target === 'B' || target === 'AB';
            const sourcePane = inA ? prev.paneA : (inB ? prev.paneB : null);
            const live = liveStateRef.current;

            let nextA = prev.paneA;
            let nextB = prev.paneB;
            if (wantInA && !inA) nextA = addIdsToPane(nextA, allIds, sourcePane, live);
            if (!wantInA && inA) nextA = purgePane(nextA, idsSet);
            if (wantInB && !inB) nextB = addIdsToPane(nextB, allIds, sourcePane, live);
            if (!wantInB && inB) nextB = purgePane(nextB, idsSet);

            const activePaneNew = prev.activeSlot === 'A' ? nextA : nextB;
            if (activePaneNew !== prev[`pane${prev.activeSlot}`]) {
                applySnapshotToLive(activePaneNew);
            }

            const newGlobalOrder = computeGlobalOrder(prev.globalOrder, nextA, nextB, allIds);

            return { ...prev, paneA: nextA, paneB: nextB, globalOrder: newGlobalOrder };
        });
    }, [collectAllIds, applySnapshotToLive, liveStateRef]);

    const exitCompareMode = useCallback(() => {
        setCompareMode(prev => {
            if (!prev.active) return prev;
            let snapshotToRestore = prev.originalSnapshot;
            if (!snapshotToRestore) {
                try {
                    const raw = localStorage.getItem(SWIPE_ORIGINAL_STORAGE_KEY);
                    snapshotToRestore = deserializeSnapshotFromStorage(raw);
                } catch { /* ignore */ }
            }
            if (snapshotToRestore) applySnapshotToLive(snapshotToRestore);
            try { localStorage.removeItem(SWIPE_ORIGINAL_STORAGE_KEY); } catch { /* ignore */ }
            const duration = enteredAtRef.current ? Math.round((Date.now() - enteredAtRef.current) / 1000) : 0;
            enteredAtRef.current = null;
            trackSwipeExit(duration);
            return { ...initialCompareMode(), swipeOrientation: prev.swipeOrientation };
        });
    }, [applySnapshotToLive]);

    const setSwipePosition = useCallback((pos) => {
        setCompareMode(prev => ({
            ...prev,
            swipePosition: Math.max(SWIPE_POS_MIN, Math.min(SWIPE_POS_MAX, pos)),
        }));
    }, []);

    const toggleSwipeOrientation = useCallback(() => {
        setCompareMode(prev => {
            const next = prev.swipeOrientation === 'horizontal' ? 'vertical' : 'horizontal';
            persistOrientation(next);
            return { ...prev, swipeOrientation: next };
        });
    }, []);

    const reorderInSlots = useCallback((newGlobalOrder) => {
        setCompareMode(prev => {
            if (!prev.active) return prev;
            const reorder = (pane) => ({
                ...pane,
                activeLayerIds: newGlobalOrder.filter(id => pane.activeLayerIds.includes(id)),
            });
            const nextA = reorder(prev.paneA);
            const nextB = reorder(prev.paneB);
            const activePaneNew = prev.activeSlot === 'A' ? nextA : nextB;
            applySnapshotToLive(activePaneNew);
            return { ...prev, paneA: nextA, paneB: nextB, globalOrder: [...newGlobalOrder] };
        });
    }, [applySnapshotToLive]);

    return {
        compareMode,
        setCompareMode,
        enterCompareMode,
        setActiveSlot,
        removeLayerFromSlot,
        toggleLayerVisibilityInSlot,
        setLayerSlotMembership,
        applyFilterToSlot,
        clearFilterFromSlot,
        reorderInSlots,
        exitCompareMode,
        setSwipePosition,
        toggleSwipeOrientation,
        paneMapRefs,
        highlightedSlots,
        highlightSlots,
    };
};
