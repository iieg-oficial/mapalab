import { useState, useCallback, useRef, useEffect } from 'react';
import { findLayerDef } from '../helpers/wmsConfig';
import { useLayers } from '@hooks/useLayers';
import { trackRasterLoop } from '@services/analyticsService';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { buildLoopValues, describeDateFilter, findLoopStartKey, isSameLoopConfig } from '../helpers/dateLoopHelpers';
import { createLoopGroup, createLoopPlayer } from '../helpers/zootropoLoop';
import { useRasterDefaultDate } from './useRasterDefaultDate';

export const DEFAULT_LOOP_INTERVAL_MS = 1000;
export const LOOP_INTERVAL_PRESETS = [250, 500, 1000, 2000, 3000];
export const DEFAULT_LOOP_DIRECTION = 'ltr';

const SLOTS = ['A', 'B'];
const clampIntervalMs = (ms) => Math.max(100, Math.min(10000, Number(ms) || DEFAULT_LOOP_INTERVAL_MS));
const normalizeDirection = (dir) => (dir === 'rtl' ? 'rtl' : 'ltr');
export const loopKeyOf = (layerId, slot) => (slot ? `${layerId}|${slot}` : layerId);

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

const isPlaying = (loop) => !!loop?.player.getSnapshot().playing;

const canResume = (r, loop, preferred) => {
    if (!loop || isPlaying(loop)) return false;
    if (preferred && !isSameLoopConfig(preferred, loop)) return false;
    const current = loop.values.find(v => v.key === loop.currentKey());
    return !!current && current.filterValue === readFilter(r, loop.layerId, loop.slot);
};

const startKeyOf = (r, layerId, slot, config) => findLoopStartKey({
    ...config, year: config.year ?? null,
    filter: readFilter(r, layerId, slot),
    rasterPeriodicity: resolveRaster(r, layerId),
});

const stateOf = (loop) => ({
    layerId: loop.layerId,
    isPlaying: isPlaying(loop),
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
    const [syncSlots, setSyncSlotsState] = useState(false);
    const loopsRef = useRef(new Map());
    const groupsRef = useRef(new Map());
    const prefsRef = useRef({});
    const refs = useRef({});
    refs.current = { applyFilter, clearFilter, getSpecificFilter, getPeriodicity, getRasterPeriodicity, allLayers, compareMode, applyFilterToSlot, syncSlots };

    useRasterDefaultDate({ activeLayerIds, allLayers, compareMode, getSpecificFilter, applyFilter, clearFilter, applyFilterToSlot });

    const getLoopPrefs = useCallback((layerId) => {
        const prefs = prefsRef.current[layerId];
        return {
            intervalMs: prefs?.intervalMs ?? DEFAULT_LOOP_INTERVAL_MS,
            direction: prefs?.direction ?? DEFAULT_LOOP_DIRECTION
        };
    }, []);

    const loopsOf = useCallback((layerId) => [...loopsRef.current.values()].filter(loop => loop.layerId === layerId), []);

    const setPref = useCallback((layerId, patch) => {
        if (!layerId) return;
        prefsRef.current[layerId] = { ...(prefsRef.current[layerId] || {}), ...patch };
        setLoopPrefs(prev => ({ ...prev, [layerId]: { ...(prev[layerId] || {}), ...patch } }));
    }, []);

    const setLoopIntervalMs = useCallback((layerId, ms) => {
        const intervalMs = clampIntervalMs(ms);
        setPref(layerId, { intervalMs });
        loopsOf(layerId).forEach(loop => loop.player.setIntervalMs(intervalMs));
        groupsRef.current.get(layerId)?.group.setIntervalMs(intervalMs);
    }, [setPref, loopsOf]);

    const setLoopDirection = useCallback((layerId, dir) => {
        const direction = normalizeDirection(dir);
        setPref(layerId, { direction });
        loopsOf(layerId).forEach(loop => loop.setDirection(direction));
        groupsRef.current.get(layerId)?.setDirection(direction);
    }, [setPref, loopsOf]);

    const sync = useCallback((layerId) => {
        const loops = loopsOf(layerId);
        setDateLoops(prev => {
            const next = { ...prev };
            loops.forEach(loop => { next[loopKeyOf(layerId, loop.slot)] = stateOf(loop); });
            return next;
        });
    }, [loopsOf]);

    const releaseGroup = useCallback((layerId) => {
        groupsRef.current.get(layerId)?.group.destroy();
        groupsRef.current.delete(layerId);
    }, []);

    const stopLoop = useCallback((layerId, slot) => {
        const loops = slot === undefined ? loopsOf(layerId) : [loopsRef.current.get(loopKeyOf(layerId, slot))].filter(Boolean);
        loops.forEach(loop => loop.player.pause());
        sync(layerId);
    }, [loopsOf, sync]);

    const createLoop = useCallback((layerId, slot, { mode, year = null, values }) => {
        const key = loopKeyOf(layerId, slot);
        loopsRef.current.get(key)?.player.destroy();
        const prefs = getLoopPrefs(layerId);
        const loop = createLoopPlayer({
            mode, year, values, intervalMs: prefs.intervalMs, direction: prefs.direction,
            onStep: (value) => {
                if (loop.silent || !value) return;
                writeFilter(refs.current, layerId, slot, value.filterValue);
                sync(layerId);
            },
            onTimeout: () => {
                sync(layerId);
                trackRasterLoop(layerId, false);
            },
        });
        Object.assign(loop, { layerId, slot, silent: false });
        loopsRef.current.set(key, loop);
        return loop;
    }, [getLoopPrefs, sync]);

    const startLoop = useCallback((layerId, config, slot = currentSlot(refs.current)) => {
        if (!config?.values || config.values.length < 2) return;
        releaseGroup(layerId);
        const synced = refs.current.syncSlots && refs.current.compareMode?.active && slot;
        const slots = synced ? SLOTS : [slot];
        const loops = slots.map(each => {
            const loop = createLoop(layerId, each, config);
            const matched = startKeyOf(refs.current, layerId, each, config);
            loop.silent = matched != null;
            loop.seek(matched ?? config.values[0].key);
            loop.silent = false;
            return loop;
        });
        if (synced) {
            const prefs = getLoopPrefs(layerId);
            const linked = createLoopGroup(loops, prefs);
            groupsRef.current.set(layerId, linked);
            linked.seek(loops[slots.indexOf(slot)].currentKey());
            linked.group.play();
        } else {
            loops[0].player.play();
        }
        sync(layerId);
    }, [createLoop, getLoopPrefs, releaseGroup, sync]);

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
        const loop = loopsRef.current.get(loopKeyOf(layerId, slot));
        const linked = groupsRef.current.get(layerId);

        if (isPlaying(loop)) {
            stopLoop(layerId, linked ? undefined : slot);
            trackRasterLoop(layerId, false);
            return;
        }

        const wantsGroup = refs.current.syncSlots && refs.current.compareMode?.active && slot && !linked;
        if (!wantsGroup && canResume(refs.current, loop, preferredConfig)) {
            if (linked) linked.group.play();
            else loop.player.play();
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
        const playing = new Set([...loopsRef.current.values()].filter(isPlaying).map(loop => loop.layerId));
        playing.forEach(layerId => {
            stopLoop(layerId);
            trackRasterLoop(layerId, false);
        });
    }, [stopLoop]);

    const cleanupLoop = useCallback((layerId) => {
        releaseGroup(layerId);
        loopsOf(layerId).forEach(loop => {
            loop.player.destroy();
            loopsRef.current.delete(loopKeyOf(layerId, loop.slot));
        });
        delete prefsRef.current[layerId];
        setDateLoops(prev => Object.fromEntries(Object.entries(prev).filter(([, state]) => state.layerId !== layerId)));
        setLoopPrefs(prev => {
            if (!prev[layerId]) return prev;
            const next = { ...prev };
            delete next[layerId];
            return next;
        });
        if (!refs.current.compareMode?.active) refs.current.clearFilter(layerId, 'date');
    }, [loopsOf, releaseGroup]);

    const setSyncSlots = useCallback((value) => {
        setSyncSlotsState(value);
        if (value) return;
        [...groupsRef.current.keys()].forEach(layerId => {
            stopLoop(layerId);
            releaseGroup(layerId);
        });
    }, [stopLoop, releaseGroup]);

    const getLoopState = useCallback((layerId, slot) => {
        if (slot !== undefined) return dateLoops[loopKeyOf(layerId, slot)] || null;
        return dateLoops[loopKeyOf(layerId, currentSlot(refs.current))]
            || Object.values(dateLoops).find(state => state.layerId === layerId)
            || null;
    }, [dateLoops]);

    const isLayerLooping = useCallback((layerId) => Object.values(dateLoops).some(state => state.layerId === layerId), [dateLoops]);

    const compareActive = !!compareMode?.active;
    const paneAIds = compareMode?.paneA?.activeLayerIds;
    const paneBIds = compareMode?.paneB?.activeLayerIds;

    useEffect(() => {
        const present = new Set(activeLayerIds);
        if (compareActive) [...(paneAIds || []), ...(paneBIds || [])].forEach(id => present.add(id));
        new Set(Object.values(dateLoops).map(state => state.layerId)).forEach(layerId => {
            if (!present.has(layerId)) cleanupLoop(layerId);
        });
    }, [activeLayerIds, compareActive, paneAIds, paneBIds, dateLoops, cleanupLoop]);

    useEffect(() => {
        if (compareActive) return;
        loopsRef.current.forEach(loop => {
            if (!loop.slot || !isPlaying(loop)) return;
            stopLoop(loop.layerId);
            trackRasterLoop(loop.layerId, false);
        });
    }, [compareActive, stopLoop]);

    useEffect(() => {
        const slot = currentSlot(refs.current);
        hiddenLayerIds.forEach(layerId => {
            const loop = loopsRef.current.get(loopKeyOf(layerId, slot));
            if (!isPlaying(loop)) return;
            stopLoop(layerId, groupsRef.current.has(layerId) ? undefined : slot);
            trackRasterLoop(layerId, false);
        });
    }, [hiddenLayerIds, stopLoop]);

    useEffect(() => {
        loopsRef.current.forEach(loop => {
            if (loadingLayers.has(loop.layerId)) loop.player.loading();
            else loop.player.ready();
        });
    }, [loadingLayers]);

    useEffect(() => {
        const loops = loopsRef.current;
        const groups = groupsRef.current;
        return () => {
            groups.forEach(linked => linked.group.destroy());
            loops.forEach(loop => loop.player.destroy());
            loops.clear();
            groups.clear();
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
        isLayerLooping,
        inferLoopConfig,
        loopPrefs,
        getLoopPrefs,
        setLoopIntervalMs,
        setLoopDirection,
        syncSlots,
        setSyncSlots,
    };
};
