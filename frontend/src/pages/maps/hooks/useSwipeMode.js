import { useCallback, useRef, useState } from 'react';
import {
    SWIPE_ORIGINAL_STORAGE_KEY,
    emptyPane,
    initialCompareMode,
    serializeSnapshotForStorage,
    deserializeSnapshotFromStorage,
} from '@pages/maps/helpers/swipeMode';

export const useSwipeMode = ({ liveStateRef, getAllChildLayerIds }) => {
    const [compareMode, setCompareMode] = useState(initialCompareMode);
    const [highlightedSlots, setHighlightedSlots] = useState(null);

    const snapshotLive = useCallback((label) => ({
        activeLayerIds: [...liveStateRef.current.activeLayerIds],
        hiddenLayerIds: [...liveStateRef.current.hiddenLayerIds],
        layerOpacities: new Map(liveStateRef.current.layerOpacities),
        filters: structuredClone(liveStateRef.current.filters),
        label,
    }), [liveStateRef]);

    const applySnapshotToLive = useCallback((snapshot) => {
        const live = liveStateRef.current;
        live.setActiveLayerIds(snapshot.activeLayerIds);
        live.setHiddenLayerIds(snapshot.hiddenLayerIds);
        live.setLayerOpacities(new Map(snapshot.layerOpacities));
        live.setFilters(structuredClone(snapshot.filters));
    }, [liveStateRef]);

    const enterSwipeMode = useCallback(() => {
        const current = snapshotLive('original');
        try {
            localStorage.setItem(
                SWIPE_ORIGINAL_STORAGE_KEY,
                JSON.stringify(serializeSnapshotForStorage(current))
            );
        } catch { /* storage no disponible */ }
        liveStateRef.current.pauseAllLoops();
        applySnapshotToLive(emptyPane('A'));
        setCompareMode({
            active: true,
            activeSlot: 'A',
            paneA: emptyPane('A'),
            paneB: emptyPane('B'),
            originalSnapshot: current,
            swipePosition: 0.5,
            swipeOrientation: 'vertical',
        });
    }, [snapshotLive, applySnapshotToLive, liveStateRef]);

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

    const purgePaneOf = useCallback((pane, idsSet) => ({
        ...pane,
        activeLayerIds: pane.activeLayerIds.filter(id => !idsSet.has(id)),
        hiddenLayerIds: pane.hiddenLayerIds.filter(id => !idsSet.has(id)),
        layerOpacities: new Map(Array.from(pane.layerOpacities.entries()).filter(([id]) => !idsSet.has(id))),
        filters: Object.fromEntries(Object.entries(pane.filters).filter(([id]) => !idsSet.has(id))),
    }), []);

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
            const newPane = purgePaneOf(prev[`pane${slot}`], idsSet);
            if (slot === prev.activeSlot) purgeLiveOf(idsSet);
            return { ...prev, [`pane${slot}`]: newPane };
        });
    }, [collectAllIds, purgePaneOf, purgeLiveOf]);

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

            const addToPane = (pane) => {
                const newIds = [...pane.activeLayerIds];
                allIds.forEach(id => { if (!newIds.includes(id)) newIds.push(id); });
                const newOpacities = new Map(pane.layerOpacities);
                const newFilters = { ...pane.filters };
                if (sourcePane) {
                    allIds.forEach(id => {
                        if (sourcePane.layerOpacities.has(id)) newOpacities.set(id, sourcePane.layerOpacities.get(id));
                        if (sourcePane.filters[id]) newFilters[id] = { ...sourcePane.filters[id] };
                    });
                }
                return { ...pane, activeLayerIds: newIds, layerOpacities: newOpacities, filters: newFilters };
            };

            let nextA = prev.paneA;
            let nextB = prev.paneB;
            if (wantInA && !inA) nextA = addToPane(nextA);
            if (!wantInA && inA) nextA = purgePaneOf(nextA, idsSet);
            if (wantInB && !inB) nextB = addToPane(nextB);
            if (!wantInB && inB) nextB = purgePaneOf(nextB, idsSet);

            const activePaneNew = prev.activeSlot === 'A' ? nextA : nextB;
            if (activePaneNew !== prev[`pane${prev.activeSlot}`]) {
                applySnapshotToLive(activePaneNew);
            }
            return { ...prev, paneA: nextA, paneB: nextB };
        });
    }, [collectAllIds, purgePaneOf, applySnapshotToLive]);

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
            return initialCompareMode();
        });
    }, [applySnapshotToLive]);

    const setSwipePosition = useCallback((pos) => {
        setCompareMode(prev => ({
            ...prev,
            swipePosition: Math.max(0.05, Math.min(0.95, pos)),
        }));
    }, []);

    const toggleSwipeOrientation = useCallback(() => {
        setCompareMode(prev => ({
            ...prev,
            swipeOrientation: prev.swipeOrientation === 'horizontal' ? 'vertical' : 'horizontal',
        }));
    }, []);

    const paneMapRefs = useRef({});

    return {
        compareMode,
        setCompareMode,
        enterSwipeMode,
        setActiveSlot,
        removeLayerFromSlot,
        toggleLayerVisibilityInSlot,
        setLayerSlotMembership,
        applyFilterToSlot,
        clearFilterFromSlot,
        exitCompareMode,
        setSwipePosition,
        toggleSwipeOrientation,
        paneMapRefs,
        highlightedSlots,
        setHighlightedSlots,
    };
};
