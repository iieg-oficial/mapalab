import { useCallback, useContext, useMemo, useState } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useLayerPeriodicity } from './useLayerPeriodicity';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { buildLoopValues } from '@pages/maps/helpers/dateLoopHelpers';
import { slotLabel } from '@pages/maps/helpers/swipeTheme';

const slotKey = (slot) => slot || 'live';

export const useSlotPeriodicity = (layerId) => {
    const {
        getLoopState, toggleLoop, stopLoop, inferLoopConfig,
        getLoopPrefs, setLoopIntervalMs, setLoopDirection,
        applyFilter, clearFilter, getSpecificFilter,
        compareMode, applyFilterToSlot, clearFilterFromSlot, allLayers,
    } = useContext(MapsContext);

    const [expanded, setExpanded] = useState({ layerId: null, years: {} });
    const { periodicity, loading } = useLayerPeriodicity(layerId);

    const layerDef = useMemo(() => (layerId ? findLayerDef(layerId, allLayers) : null), [layerId, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const hasPeriodicity = !layerDef?.hidePeriodicity
        && (periodicity != null || loading || rasterPeriodicity != null);

    const loopState = layerId ? getLoopState?.(layerId) : null;
    const isLoopPlaying = loopState?.isPlaying ?? false;
    const loopSlot = loopState?.slot ?? null;
    const prefs = layerId ? getLoopPrefs?.(layerId) : null;

    const expandedYearOf = useCallback((slot) => (
        expanded.layerId === layerId ? expanded.years[slotKey(slot)] ?? null : null
    ), [expanded, layerId]);

    const setExpandedYear = useCallback((slot, year) => {
        setExpanded(prev => {
            const years = prev.layerId === layerId ? prev.years : {};
            if (years[slotKey(slot)] === year && prev.layerId === layerId) return prev;
            return { layerId, years: { ...years, [slotKey(slot)]: year } };
        });
    }, [layerId]);

    const viewLoopConfig = useCallback((slot) => {
        if (!layerId) return null;
        const expandedYear = expandedYearOf(slot);
        if (expandedYear != null) {
            const values = buildLoopValues({ mode: 'month', year: expandedYear, rasterPeriodicity, periodicity });
            return values.length >= 2 ? { mode: 'month', year: expandedYear, values } : null;
        }
        const values = buildLoopValues({ mode: 'year', rasterPeriodicity, periodicity });
        return values.length >= 2 ? { mode: 'year', values } : null;
    }, [layerId, expandedYearOf, rasterPeriodicity, periodicity]);

    const canPlayIn = useCallback((slot) => !!layerId
        && (!!loopState || viewLoopConfig(slot) != null || inferLoopConfig?.(layerId, slot) != null),
    [layerId, loopState, viewLoopConfig, inferLoopConfig]);

    const forSlot = useCallback((slot = null) => {
        const pane = slot ? compareMode?.[`pane${slot}`] : null;
        const ownsLoop = loopSlot === slot;
        const otro = slot === 'A' ? 'B' : 'A';
        const stopOwnLoop = () => { if (ownsLoop && isLoopPlaying) stopLoop?.(layerId); };
        return {
            apply: (fd) => {
                if (!layerId) return;
                if (slot) applyFilterToSlot?.(layerId, slot, fd.filterName, fd.cqlFilter);
                else applyFilter?.(layerId, fd.filterName, fd.cqlFilter);
            },
            clear: () => {
                if (!layerId) return;
                stopOwnLoop();
                if (slot) clearFilterFromSlot?.(layerId, slot, 'date');
                else clearFilter?.(layerId, 'date');
            },
            getFilter: slot ? (id, name) => pane?.filters?.[id]?.[name] || null : undefined,
            hasFilter: slot ? !!pane?.filters?.[layerId]?.date : !!getSpecificFilter?.(layerId, 'date'),
            canPlay: canPlayIn(slot),
            isPlaying: isLoopPlaying && ownsLoop,
            loopDisabled: isLoopPlaying && !ownsLoop,
            loopDisabledHint: `Pausa la animación del lado ${slotLabel(otro)} para iniciar acá`,
            toggleLoop: () => layerId && toggleLoop?.(layerId, viewLoopConfig(slot), slot),
            onExpandedYearChange: (year) => setExpandedYear(slot, year),
        };
    }, [layerId, compareMode, loopSlot, isLoopPlaying, stopLoop, applyFilterToSlot, applyFilter, clearFilterFromSlot, clearFilter, getSpecificFilter, canPlayIn, toggleLoop, viewLoopConfig, setExpandedYear]);

    return {
        periodicity,
        rasterPeriodicity,
        loading,
        hasPeriodicity,
        isLoopPlaying,
        intervalMs: prefs?.intervalMs,
        direction: prefs?.direction,
        setLoopIntervalMs: useCallback((ms) => layerId && setLoopIntervalMs?.(layerId, ms), [layerId, setLoopIntervalMs]),
        setLoopDirection: useCallback((dir) => layerId && setLoopDirection?.(layerId, dir), [layerId, setLoopDirection]),
        forSlot,
    };
};
