import { useState, useCallback, useRef, useEffect } from 'react';
import { findLayerDef } from '../helpers/wmsConfig';
import { layers as allLayers } from '../helpers/layers/index';
import { trackRasterLoop } from '@services/analyticsService';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { buildLoopValues, describeDateFilter } from '../helpers/dateLoopHelpers';

export const DEFAULT_LOOP_INTERVAL_MS = 500;
export const LOOP_INTERVAL_PRESETS = [250, 500, 1000, 2000, 3000];
export const DEFAULT_LOOP_DIRECTION = 'ltr';

const clampIntervalMs = (ms) => Math.max(100, Math.min(10000, Number(ms) || DEFAULT_LOOP_INTERVAL_MS));
const normalizeDirection = (dir) => (dir === 'rtl' ? 'rtl' : 'ltr');

export const useDateLoop = ({ applyFilter, clearFilter, activeLayerIds, hiddenLayerIds = [], getSpecificFilter, getPeriodicity }) => {
    const { loadingLayers } = useLayerLoading();
    const [dateLoops, setDateLoops] = useState({});
    const [loopPrefs, setLoopPrefs] = useState({});
    const loopDataRef = useRef({});
    const timersRef = useRef(new Map());
    const appliedDefaultsRef = useRef(new Set());
    const prefsRef = useRef({});
    const refs = useRef({});
    refs.current.applyFilter = applyFilter;
    refs.current.loadingLayers = loadingLayers;
    refs.current.getSpecificFilter = getSpecificFilter;
    refs.current.getPeriodicity = getPeriodicity;

    const getLoopPrefs = useCallback((layerId) => {
        const prefs = prefsRef.current[layerId];
        return {
            intervalMs: prefs?.intervalMs ?? DEFAULT_LOOP_INTERVAL_MS,
            direction: prefs?.direction ?? DEFAULT_LOOP_DIRECTION
        };
    }, []);

    const setLoopIntervalMs = useCallback((layerId, ms) => {
        if (!layerId) return;
        const clamped = clampIntervalMs(ms);
        prefsRef.current[layerId] = { ...(prefsRef.current[layerId] || {}), intervalMs: clamped };
        setLoopPrefs(prev => ({
            ...prev,
            [layerId]: { ...(prev[layerId] || {}), intervalMs: clamped }
        }));
    }, []);

    const setLoopDirection = useCallback((layerId, dir) => {
        if (!layerId) return;
        const normalized = normalizeDirection(dir);
        prefsRef.current[layerId] = { ...(prefsRef.current[layerId] || {}), direction: normalized };
        setLoopPrefs(prev => ({
            ...prev,
            [layerId]: { ...(prev[layerId] || {}), direction: normalized }
        }));
    }, []);

    const clearTimer = useCallback((layerId) => {
        const id = timersRef.current.get(layerId);
        if (id != null) {
            clearTimeout(id);
            timersRef.current.delete(layerId);
        }
    }, []);

    const runNextTick = useCallback((layerId) => {
        clearTimer(layerId);

        const doTick = () => {
            const data = loopDataRef.current[layerId];
            if (!data || !data.isPlaying) return;

            const prefs = prefsRef.current[layerId] || {};
            const intervalMs = prefs.intervalMs ?? DEFAULT_LOOP_INTERVAL_MS;
            const direction = prefs.direction ?? DEFAULT_LOOP_DIRECTION;

            if (refs.current.loadingLayers.has(layerId)) {
                timersRef.current.set(layerId, setTimeout(doTick, 100));
                return;
            }

            const { values } = data;
            const currentIdx = values.findIndex(v => v.key === data.currentKey);
            const step = direction === 'rtl' ? -1 : 1;
            const nextIdx = (currentIdx + step + values.length) % values.length;
            const next = values[nextIdx];

            refs.current.applyFilter(layerId, 'date', next.filterValue);
            data.currentKey = next.key;
            setDateLoops(prev => ({
                ...prev,
                [layerId]: { ...prev[layerId], currentKey: next.key }
            }));

            timersRef.current.set(layerId, setTimeout(doTick, intervalMs));
        };

        const prefs = prefsRef.current[layerId] || {};
        const intervalMs = prefs.intervalMs ?? DEFAULT_LOOP_INTERVAL_MS;
        timersRef.current.set(layerId, setTimeout(doTick, intervalMs));
    }, [clearTimer]);

    const startLoop = useCallback((layerId, config) => {
        const { mode, year = null, values } = config || {};
        if (!values || values.length < 2) return;

        const existing = loopDataRef.current[layerId];
        const sameMode = existing?.mode === mode && existing?.year === year;
        const startKey = sameMode && values.some(v => v.key === existing.currentKey)
            ? existing.currentKey
            : values[0].key;

        const data = { isPlaying: true, currentKey: startKey, mode, year, values };
        loopDataRef.current[layerId] = data;

        setDateLoops(prev => ({
            ...prev,
            [layerId]: { isPlaying: true, currentKey: startKey, mode, year }
        }));

        runNextTick(layerId);
    }, [runNextTick]);

    const stopLoop = useCallback((layerId) => {
        const data = loopDataRef.current[layerId];
        if (data) data.isPlaying = false;
        clearTimer(layerId);

        setDateLoops(prev => {
            if (!prev[layerId]) return prev;
            return { ...prev, [layerId]: { ...prev[layerId], isPlaying: false } };
        });
    }, [clearTimer]);

    const inferLoopConfig = useCallback((layerId) => {
        const layerDef = findLayerDef(layerId, allLayers);
        const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
        const periodicity = refs.current.getPeriodicity?.(layerId) || null;
        const currentFilter = refs.current.getSpecificFilter?.(layerId, 'date');
        const desc = describeDateFilter({ filter: currentFilter, rasterPeriodicity });

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
            const values = buildLoopValues({
                mode: 'month', year: desc.year,
                rasterPeriodicity, periodicity
            });
            if (values.length >= 2) return { mode: 'month', year: desc.year, values };
        }

        return null;
    }, []);

    const toggleLoop = useCallback((layerId) => {
        const data = loopDataRef.current[layerId];

        if (data && data.isPlaying) {
            stopLoop(layerId);
            trackRasterLoop(layerId, false);
            return;
        }

        if (data && !data.isPlaying) {
            data.isPlaying = true;
            setDateLoops(prev => ({
                ...prev,
                [layerId]: { ...prev[layerId], isPlaying: true }
            }));
            runNextTick(layerId);
            trackRasterLoop(layerId, true);
            return;
        }

        const config = inferLoopConfig(layerId);
        if (!config) return;
        startLoop(layerId, config);
        trackRasterLoop(layerId, true);
    }, [stopLoop, startLoop, runNextTick, inferLoopConfig]);

    const pauseAllLoops = useCallback(() => {
        Object.keys(loopDataRef.current).forEach(layerId => {
            const data = loopDataRef.current[layerId];
            if (data?.isPlaying) {
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

        clearFilter(layerId, 'date');
    }, [stopLoop, clearFilter]);

    const getLoopState = useCallback((layerId) => {
        return dateLoops[layerId] || null;
    }, [dateLoops]);

    useEffect(() => {
        activeLayerIds.forEach(layerId => {
            if (appliedDefaultsRef.current.has(layerId)) return;
            const layerDef = findLayerDef(layerId, allLayers);
            if (!layerDef?.rasterPeriodicity) return;

            const periodicity = layerDef.rasterPeriodicity;
            const years = Object.keys(periodicity).map(Number).sort((a, b) => b - a);
            const firstYear = years[0];
            if (!firstYear) return;

            const yearData = periodicity[firstYear];
            if (typeof yearData === 'object') {
                const months = Object.keys(yearData).map(Number).sort((a, b) => a - b);
                const lastMonth = months[months.length - 1];
                if (lastMonth != null && yearData[lastMonth]) {
                    applyFilter(layerId, 'date', yearData[lastMonth]);
                }
            }

            appliedDefaultsRef.current.add(layerId);
        });

        [...appliedDefaultsRef.current].forEach(id => {
            if (!activeLayerIds.includes(id)) {
                appliedDefaultsRef.current.delete(id);
            }
        });
    }, [activeLayerIds, applyFilter]);

    useEffect(() => {
        Object.keys(dateLoops).forEach(layerId => {
            if (!activeLayerIds.includes(layerId)) {
                cleanupLoop(layerId);
            }
        });
    }, [activeLayerIds, dateLoops, cleanupLoop]);

    useEffect(() => {
        hiddenLayerIds.forEach(layerId => {
            const data = loopDataRef.current[layerId];
            if (data?.isPlaying) {
                stopLoop(layerId);
                trackRasterLoop(layerId, false);
            }
        });
    }, [hiddenLayerIds, stopLoop]);

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
