import { useCallback, useContext, useMemo, useState } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useLayerPeriodicity } from './useLayerPeriodicity';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { buildLoopValues } from '@pages/maps/helpers/dateLoopHelpers';

export const useSlotPeriodicity = (layerId) => {
    const {
        getLoopState, startLoop, toggleLoop, stopLoop, inferLoopConfig,
        getLoopPrefs, setLoopIntervalMs, setLoopDirection,
        compareMode, applyFilterToSlot, clearFilterFromSlot, setActiveSlot, allLayers,
    } = useContext(MapsContext);

    const [expandedYear, setExpandedYear] = useState(null);
    const { periodicity, loading } = useLayerPeriodicity(layerId);

    const layerDef = useMemo(() => (layerId ? findLayerDef(layerId, allLayers) : null), [layerId, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const hasPeriodicity = !layerDef?.hidePeriodicity
        && (periodicity != null || loading || rasterPeriodicity != null);

    const loopState = layerId ? getLoopState?.(layerId) : null;
    const isLoopPlaying = loopState?.isPlaying ?? false;
    const prefs = layerId ? getLoopPrefs?.(layerId) : null;

    const viewLoopConfig = useCallback(() => {
        if (!layerId) return null;
        if (expandedYear != null) {
            const values = buildLoopValues({ mode: 'month', year: expandedYear, rasterPeriodicity, periodicity });
            return values.length >= 2 ? { mode: 'month', year: expandedYear, values } : null;
        }
        const values = buildLoopValues({ mode: 'year', rasterPeriodicity, periodicity });
        return values.length >= 2 ? { mode: 'year', values } : null;
    }, [layerId, expandedYear, rasterPeriodicity, periodicity]);

    const canPlay = !!layerId
        && (!!loopState || viewLoopConfig() != null || inferLoopConfig?.(layerId) != null);

    const togglePeriodicityLoop = useCallback(() => {
        if (!layerId) return;
        if (loopState?.isPlaying) {
            stopLoop?.(layerId);
            return;
        }
        const desiredMode = expandedYear != null ? 'month' : 'year';
        if (loopState && loopState.mode === desiredMode) {
            toggleLoop?.(layerId);
            return;
        }
        if (loopState) stopLoop?.(layerId);
        const config = viewLoopConfig() || inferLoopConfig?.(layerId);
        if (config) startLoop?.(layerId, config);
    }, [layerId, loopState, expandedYear, viewLoopConfig, inferLoopConfig, startLoop, stopLoop, toggleLoop]);

    const toggleLoopInSlot = useCallback((slot) => {
        if (!layerId) return;
        if (slot && compareMode?.active && compareMode.activeSlot !== slot && !loopState?.isPlaying) {
            setActiveSlot?.(slot);
            requestAnimationFrame(togglePeriodicityLoop);
            return;
        }
        togglePeriodicityLoop();
    }, [layerId, compareMode?.active, compareMode?.activeSlot, loopState?.isPlaying, setActiveSlot, togglePeriodicityLoop]);

    const forSlot = useCallback((slot) => {
        const otro = slot === 'A' ? 'B' : 'A';
        const filters = compareMode?.[`pane${slot}`]?.filters;
        return {
            apply: (filterData) => layerId && applyFilterToSlot?.(layerId, slot, filterData.filterName, filterData.cqlFilter),
            clear: () => layerId && clearFilterFromSlot?.(layerId, slot, 'date'),
            getFilter: (id, name) => compareMode?.[`pane${slot}`]?.filters?.[id]?.[name] || null,
            hasFilter: !!filters?.[layerId]?.date,
            isPlaying: isLoopPlaying && compareMode?.activeSlot === slot,
            loopDisabled: isLoopPlaying && compareMode?.activeSlot !== slot,
            loopDisabledHint: `Pausa la animación del lado ${otro} para iniciar acá`,
            toggleLoop: () => toggleLoopInSlot(slot),
        };
    }, [layerId, compareMode, applyFilterToSlot, clearFilterFromSlot, isLoopPlaying, toggleLoopInSlot]);

    return {
        periodicity,
        rasterPeriodicity,
        loading,
        hasPeriodicity,
        canPlay,
        isLoopPlaying,
        intervalMs: prefs?.intervalMs,
        direction: prefs?.direction,
        expandedYear,
        setExpandedYear,
        setLoopIntervalMs: useCallback((ms) => layerId && setLoopIntervalMs?.(layerId, ms), [layerId, setLoopIntervalMs]),
        setLoopDirection: useCallback((dir) => layerId && setLoopDirection?.(layerId, dir), [layerId, setLoopDirection]),
        forSlot,
    };
};
