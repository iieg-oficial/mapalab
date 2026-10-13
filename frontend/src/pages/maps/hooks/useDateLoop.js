import { useState, useCallback, useRef, useEffect } from 'react';
import { findLayerDef } from '../helpers/wmsConfig';
import { useLayers } from '@hooks/useLayers';
import { trackRasterLoop } from '@services/analyticsService';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { buildLoopValues, describeDateFilter, findLoopStartKey, isSameLoopConfig } from '../helpers/dateLoopHelpers';
import { createLoopPlayer } from '../helpers/zootropoLoop';
import { useRasterDefaultDate } from './useRasterDefaultDate';

export const DEFAULT_LOOP_INTERVAL_MS = 1000;
export const LOOP_INTERVAL_PRESETS = [250, 500, 1000, 2000, 3000];
export const DEFAULT_LOOP_DIRECTION = 'ltr';

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

const canResume = (r, layerId, loop, preferred, slot) => {
    if (!loop || loop.player.getSnapshot().playing || loop.slot !== slot) return false;
    if (preferred && !isSameLoopConfig(preferred, loop)) return false;
    const current = loop.values.find(v => v.key === loop.currentKey());
    return !!current && current.filterValue === readFilter(r, layerId, slot);
};

const stateOf = (loop) => ({
    isPlaying: loop.player.getSnapshot().playing,
    currentKey: loop.currentKey(),
    mode: loop.mode,
    year: loop.year,
    slot: loop.slot,
});

export const useDateLoop = ({
    applyFilter, clearFilter, activeLayerIds, hiddenLayerIds = [], getSpecificFilter, getPeriodicity,
    getRasterPeriodicity, compareMode = null, applyFilterToSlot,
}) => {
    const { layers: allLayers } = useLayers();
    const { loadingLayers } = useLayerLoading();
    const [dateLoops, setDateLoops] = useState({});
    const [loopPrefs, setLoopPrefs] = useState({});
    const loopsRef = useRef(new Map());
    const prefsRef = useRef({});
    const refs = useRef({});
    refs.current = { applyFilter, clearFilter, getSpecificFilter, getPeriodicity, getRasterPeriodicity, allLayers, compareMode, applyFilterToSlot };

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

    const setLoopIntervalMs = useCallback((layerId, ms) => {
        const intervalMs = clampIntervalMs(ms);
        setPref(layerId, { intervalMs });
        loopsRef.current.get(layerId)?.player.setIntervalMs(intervalMs);
    }, [setPref]);

    const setLoopDirection = useCallback((layerId, dir) => {
        const direction = normalizeDirection(dir);
        setPref(layerId, { direction });
        loopsRef.current.get(layerId)?.setDirection(direction);
    }, [setPref]);

    const sync = useCallback((layerId) => {
        const loop = loopsRef.current.get(layerId);
        if (loop) setDateLoops(prev => ({ ...prev, [layerId]: stateOf(loop) }));
    }, []);

    const stopLoop = useCallback((layerId) => {
        const loop = loopsRef.current.get(layerId);
        if (!loop) return;
        loop.player.pause();
        sync(layerId);
    }, [sync]);

    const startLoop = useCallback((layerId, config, slot = currentSlot(refs.current)) => {
        const { mode, year = null, values } = config || {};
        if (!values || values.length < 2) return;

        const r = refs.current;
        const filter = readFilter(r, layerId, slot);
        const matched = findLoopStartKey({ values, mode, year, filter, rasterPeriodicity: resolveRaster(r, layerId) });
        const prefs = getLoopPrefs(layerId);

        loopsRef.current.get(layerId)?.player.destroy();
        let silent = matched != null;
        const loop = createLoopPlayer({
            mode, year, values, intervalMs: prefs.intervalMs, direction: prefs.direction,
            onStep: (value) => {
                if (silent || !value) return;
                writeFilter(refs.current, layerId, loop.slot, value.filterValue);
                sync(layerId);
            },
            onTimeout: () => {
                sync(layerId);
                trackRasterLoop(layerId, false);
            },
        });
        loop.slot = slot;
        loopsRef.current.set(layerId, loop);
        loop.seek(matched ?? values[0].key);
        silent = false;
        loop.player.play();
        sync(layerId);
    }, [getLoopPrefs, sync]);

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
        const loop = loopsRef.current.get(layerId);

        if (loop?.player.getSnapshot().playing) {
            stopLoop(layerId);
            trackRasterLoop(layerId, false);
            return;
        }

        if (canResume(refs.current, layerId, loop, preferredConfig, slot)) {
            loop.player.play();
            sync(layerId);
            trackRasterLoop(layerId, true);
            return;
        }

        const config = preferredConfig || inferLoopConfig(layerId, slot);
        if (!config) return;
        startLoop(layerId, config, slot);
        trackRasterLoop(layerId, true);
    }, [stopLoop, startLoop, sync, inferLoopConfig]);

    const pauseAllLoops = useCallback(() => {
        loopsRef.current.forEach((loop, layerId) => {
            if (!loop.player.getSnapshot().playing) return;
            stopLoop(layerId);
            trackRasterLoop(layerId, false);
        });
    }, [stopLoop]);

    const cleanupLoop = useCallback((layerId) => {
        loopsRef.current.get(layerId)?.player.destroy();
        loopsRef.current.delete(layerId);
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
    }, []);

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
        if (compareActive) return;
        loopsRef.current.forEach((loop, layerId) => {
            if (!loop.slot || !loop.player.getSnapshot().playing) return;
            stopLoop(layerId);
            trackRasterLoop(layerId, false);
        });
    }, [compareActive, stopLoop]);

    useEffect(() => {
        const slot = currentSlot(refs.current);
        hiddenLayerIds.forEach(layerId => {
            const loop = loopsRef.current.get(layerId);
            if (loop?.player.getSnapshot().playing && (loop.slot ?? null) === slot) {
                stopLoop(layerId);
                trackRasterLoop(layerId, false);
            }
        });
    }, [hiddenLayerIds, stopLoop]);

    useEffect(() => {
        loopsRef.current.forEach((loop, layerId) => {
            if (loadingLayers.has(layerId)) loop.player.loading();
            else loop.player.ready();
        });
    }, [loadingLayers]);

    useEffect(() => {
        const loops = loopsRef.current;
        return () => {
            loops.forEach(loop => loop.player.destroy());
            loops.clear();
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
