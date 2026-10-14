import { useCallback, useContext, useMemo, useState } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useLayerPeriodicity } from './useLayerPeriodicity';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { buildLoopValues } from '@pages/maps/helpers/dateLoopHelpers';
import { dateColumnOf } from '@services/layerMetadataService';

const slotKey = (slot) => slot || 'live';

export const useSlotPeriodicity = (layerId) => {
    const {
        getLoopState, toggleLoop, stopLoop, inferLoopConfig,
        getLoopPrefs, setLoopIntervalMs, setLoopDirection, syncSlots, setSyncSlots,
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
            const values = buildLoopValues({ mode: 'month', year: expandedYear, rasterPeriodicity, periodicity, filterColumn: dateColumnOf(layerId) });
            return values.length >= 2 ? { mode: 'month', year: expandedYear, values } : null;
        }
        const values = buildLoopValues({ mode: 'year', rasterPeriodicity, periodicity, filterColumn: dateColumnOf(layerId) });
        return values.length >= 2 ? { mode: 'year', values } : null;
    }, [layerId, expandedYearOf, rasterPeriodicity, periodicity]);

    const canPlayIn = useCallback((slot) => !!layerId
        && (!!getLoopState?.(layerId, slot ?? null) || viewLoopConfig(slot) != null || inferLoopConfig?.(layerId, slot) != null),
    [layerId, getLoopState, viewLoopConfig, inferLoopConfig]);

    const forSlot = useCallback((slot = null) => {
        const pane = slot ? compareMode?.[`pane${slot}`] : null;
        const playing = !!(layerId && getLoopState?.(layerId, slot ?? null)?.isPlaying);
        const stopOwnLoop = () => { if (playing) stopLoop?.(layerId, slot ?? null); };
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
            isPlaying: playing,
            loopDisabled: false,
            loopDisabledHint: '',
            toggleLoop: () => layerId && toggleLoop?.(layerId, viewLoopConfig(slot), slot),
            onExpandedYearChange: (year) => setExpandedYear(slot, year),
        };
    }, [layerId, compareMode, getLoopState, stopLoop, applyFilterToSlot, applyFilter, clearFilterFromSlot, clearFilter, getSpecificFilter, canPlayIn, toggleLoop, viewLoopConfig, setExpandedYear]);

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
        syncSlots: !!syncSlots,
        setSyncSlots,
        forSlot,
    };
};
