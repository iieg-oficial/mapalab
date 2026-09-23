import { useState, useCallback, useRef, useEffect } from 'react';
import { findLayerDef } from '../helpers/wmsConfig';
import { useLayers } from '@hooks/useLayers';
import { trackRasterLoop } from '@services/analyticsService';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { buildLoopValues, describeDateFilter, findLoopStartKey, isSameLoopConfig } from '../helpers/dateLoopHelpers';
import { useRasterDefaultDate } from './useRasterDefaultDate';

export const DEFAULT_LOOP_INTERVAL_MS = 1000;
export const LOOP_INTERVAL_PRESETS = [250, 500, 1000, 2000, 3000];
export const DEFAULT_LOOP_DIRECTION = 'ltr';

const MAX_LOADING_RETRIES = 300;

const clampIntervalMs = (ms) => Math.max(100, Math.min(10000, Number(ms) || DEFAULT_LOOP_INTERVAL_MS));
const normalizeDirection = (dir) => (dir === 'rtl' ? 'rtl' : 'ltr');

const currentSlot = (r) => (r.compareMode?.active ? r.compareMode.activeSlot : null);

const resolveRaster = (r, layerId) => r.getRasterPeriodicity?.(layerId)
    ?? findLayerDef(layerId, r.allLayers)?.rasterPeriodicity
    ?? null;

const readFilter = (r, layerId, slot) => {
    const cm = r.compareMode;
    if (slot && cm?.active && slot !== cm.activeSlot) return cm[`pane${slot}`]?.filters?.[layerId]?.date || null;
    return r.getSpecificFilter?.(layerId, 'date') || null;
};

const writeFilter = (r, layerId, slot, value) => {
    if (slot && r.compareMode?.active) {
        r.applyFilterToSlot?.(layerId, slot, 'date', value);
        return;
    }
    r.applyFilter(layerId, 'date', value);
};

const canResume = (r, layerId, data, preferred, slot) => {
    if (!data || data.isPlaying || data.slot !== slot) return false;
    if (preferred && !isSameLoopConfig(preferred, data)) return false;
    const current = data.values.find(v => v.key === data.currentKey);
    return !!current && current.filterValue === readFilter(r, layerId, slot);
};

export const useDateLoop = ({
    applyFilter, clearFilter, activeLayerIds, hiddenLayerIds = [], getSpecificFilter, getPeriodicity,
    getRasterPeriodicity, compareMode = null, applyFilterToSlot,
}) => {
    const { layers: allLayers } = useLayers();
    const { loadingLayers } = useLayerLoading();
    const [dateLoops, setDateLoops] = useState({});
    const [loopPrefs, setLoopPrefs] = useState({});
    const loopDataRef = useRef({});
    const timersRef = useRef(new Map());
    const prefsRef = useRef({});
    const refs = useRef({});
    refs.current = { applyFilter, clearFilter, loadingLayers, getSpecificFilter, getPeriodicity, getRasterPeriodicity, allLayers, compareMode, applyFilterToSlot };

    useRasterDefaultDate({ activeLayerIds, allLayers, compareMode, getSpecificFilter, applyFilter, clearFilter, applyFilterToSlot });

    const getLoopPrefs = useCallback((layerId) => {
        const prefs = prefsRef.current[layerId];
        return {
            intervalMs: prefs?.intervalMs ?? DEFAULT_LOOP_INTERVAL_MS,
            direction: prefs?.direction ?? DEFAULT_LOOP_DIRECTION
        };
    }, []);

    const setPref = useCallback((layerId, patch) => {
        if (!layerId) return;
        prefsRef.current[layerId] = { ...(prefsRef.current[layerId] || {}), ...patch };
        setLoopPrefs(prev => ({ ...prev, [layerId]: { ...(prev[layerId] || {}), ...patch } }));
    }, []);

    const setLoopIntervalMs = useCallback((layerId, ms) => setPref(layerId, { intervalMs: clampIntervalMs(ms) }), [setPref]);
    const setLoopDirection = useCallback((layerId, dir) => setPref(layerId, { direction: normalizeDirection(dir) }), [setPref]);

    const clearTimer = useCallback((layerId) => {
        const id = timersRef.current.get(layerId);
        if (id != null) {
            clearTimeout(id);
            timersRef.current.delete(layerId);
        }
    }, []);

    const stopLoop = useCallback((layerId) => {
        const data = loopDataRef.current[layerId];
        if (data) data.isPlaying = false;
        clearTimer(layerId);
        setDateLoops(prev => (prev[layerId] ? { ...prev, [layerId]: { ...prev[layerId], isPlaying: false } } : prev));
    }, [clearTimer]);

    const runNextTick = useCallback((layerId) => {
        clearTimer(layerId);

        const doTick = () => {
            const data = loopDataRef.current[layerId];
            if (!data || !data.isPlaying) return;
            if (data.slot && !refs.current.compareMode?.active) {
                stopLoop(layerId);
                trackRasterLoop(layerId, false);
                return;
            }

            const prefs = prefsRef.current[layerId] || {};
            const intervalMs = prefs.intervalMs ?? DEFAULT_LOOP_INTERVAL_MS;
            const direction = prefs.direction ?? DEFAULT_LOOP_DIRECTION;

            if (refs.current.loadingLayers.has(layerId)) {
                data.loadingRetries = (data.loadingRetries || 0) + 1;
                if (data.loadingRetries > MAX_LOADING_RETRIES) {
                    stopLoop(layerId);
                    trackRasterLoop(layerId, false);
                    return;
                }
                timersRef.current.set(layerId, setTimeout(doTick, 100));
                return;
            }
            data.loadingRetries = 0;

            const { values } = data;
            const currentIdx = values.findIndex(v => v.key === data.currentKey);
            const step = direction === 'rtl' ? -1 : 1;
            const next = values[(currentIdx + step + values.length) % values.length];

            writeFilter(refs.current, layerId, data.slot, next.filterValue);
            data.currentKey = next.key;
            setDateLoops(prev => ({ ...prev, [layerId]: { ...prev[layerId], currentKey: next.key } }));

            timersRef.current.set(layerId, setTimeout(doTick, intervalMs));
        };

        const prefs = prefsRef.current[layerId] || {};
        timersRef.current.set(layerId, setTimeout(doTick, prefs.intervalMs ?? DEFAULT_LOOP_INTERVAL_MS));
    }, [clearTimer, stopLoop]);

    const startLoop = useCallback((layerId, config, slot = currentSlot(refs.current)) => {
        const { mode, year = null, values } = config || {};
        if (!values || values.length < 2) return;

        const r = refs.current;
        const filter = readFilter(r, layerId, slot);
        const matched = findLoopStartKey({ values, mode, year, filter, rasterPeriodicity: resolveRaster(r, layerId) });
        const startKey = matched ?? values[0].key;
        if (matched == null) writeFilter(r, layerId, slot, values[0].filterValue);

        loopDataRef.current[layerId] = { isPlaying: true, currentKey: startKey, mode, year, values, slot };
        setDateLoops(prev => ({ ...prev, [layerId]: { isPlaying: true, currentKey: startKey, mode, year, slot } }));
        runNextTick(layerId);
    }, [runNextTick]);

    const inferLoopConfig = useCallback((layerId, slot = currentSlot(refs.current)) => {
        const r = refs.current;
        const rasterPeriodicity = resolveRaster(r, layerId);
        const periodicity = r.getPeriodicity?.(layerId) || null;
        const desc = describeDateFilter({ filter: readFilter(r, layerId, slot), rasterPeriodicity });

        if (desc && !desc.multi && desc.months?.length >= 1) {
            const values = buildLoopValues({
                mode: 'month', year: desc.year,
                rasterPeriodicity, periodicity,
                monthsSelection: new Set(desc.months)
            });
            if (values.length >= 2) return { mode: 'month', year: desc.year, values };
        }

        const yearValues = buildLoopValues({ mode: 'year', rasterPeriodicity, periodicity });
        if (yearValues.length >= 2) return { mode: 'year', values: yearValues };

        if (desc && !desc.multi) {
            const values = buildLoopValues({ mode: 'month', year: desc.year, rasterPeriodicity, periodicity });
            if (values.length >= 2) return { mode: 'month', year: desc.year, values };
        }

        return null;
    }, []);

    const toggleLoop = useCallback((layerId, preferredConfig = null, slot = currentSlot(refs.current)) => {
        const data = loopDataRef.current[layerId];

        if (data?.isPlaying) {
            stopLoop(layerId);
            trackRasterLoop(layerId, false);
            return;
        }

        if (canResume(refs.current, layerId, data, preferredConfig, slot)) {
            data.isPlaying = true;
            data.loadingRetries = 0;
            setDateLoops(prev => ({ ...prev, [layerId]: { ...prev[layerId], isPlaying: true } }));
            runNextTick(layerId);
            trackRasterLoop(layerId, true);
            return;
        }

        const config = preferredConfig || inferLoopConfig(layerId, slot);
        if (!config) return;
        startLoop(layerId, config, slot);
        trackRasterLoop(layerId, true);
    }, [stopLoop, startLoop, runNextTick, inferLoopConfig]);

    const pauseAllLoops = useCallback(() => {
        Object.keys(loopDataRef.current).forEach(layerId => {
            if (loopDataRef.current[layerId]?.isPlaying) {
                stopLoop(layerId);
                trackRasterLoop(layerId, false);
            }
        });
    }, [stopLoop]);

    const cleanupLoop = useCallback((layerId) => {
        stopLoop(layerId);
        delete loopDataRef.current[layerId];
        delete prefsRef.current[layerId];
        setDateLoops(prev => {
            const next = { ...prev };
            delete next[layerId];
            return next;
        });
        setLoopPrefs(prev => {
            if (!prev[layerId]) return prev;
            const next = { ...prev };
            delete next[layerId];
            return next;
        });
        if (!refs.current.compareMode?.active) refs.current.clearFilter(layerId, 'date');
    }, [stopLoop]);

    const getLoopState = useCallback((layerId) => dateLoops[layerId] || null, [dateLoops]);

    const compareActive = !!compareMode?.active;
    const paneAIds = compareMode?.paneA?.activeLayerIds;
    const paneBIds = compareMode?.paneB?.activeLayerIds;

    useEffect(() => {
        const present = new Set(activeLayerIds);
        if (compareActive) [...(paneAIds || []), ...(paneBIds || [])].forEach(id => present.add(id));
        Object.keys(dateLoops).forEach(layerId => {
            if (!present.has(layerId)) cleanupLoop(layerId);
        });
    }, [activeLayerIds, compareActive, paneAIds, paneBIds, dateLoops, cleanupLoop]);

    useEffect(() => {
        const slot = currentSlot(refs.current);
        hiddenLayerIds.forEach(layerId => {
            const data = loopDataRef.current[layerId];
            if (data?.isPlaying && (data.slot ?? null) === slot) {
                stopLoop(layerId);
                trackRasterLoop(layerId, false);
            }
        });
    }, [hiddenLayerIds, stopLoop]);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach(id => clearTimeout(id));
            timers.clear();
        };
    }, []);

    const hasActiveLoops = Object.values(dateLoops).some(l => l.isPlaying);

    return {
        dateLoops,
        hasActiveLoops,
        startLoop,
        stopLoop,
        pauseAllLoops,
        toggleLoop,
        cleanupLoop,
        getLoopState,
        inferLoopConfig,
        loopPrefs,
        getLoopPrefs,
        setLoopIntervalMs,
        setLoopDirection
    };
};
