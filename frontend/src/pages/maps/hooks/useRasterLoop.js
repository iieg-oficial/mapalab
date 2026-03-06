import { useState, useCallback, useRef, useEffect } from 'react';
import { findLayerDef } from '../helpers/wmsConfig';
import { layers as allLayers } from '../helpers/layers/index';
import { trackRasterLoop } from '@services/analyticsService';
import { useLayerLoading } from '@hooks/useLayerLoading';

export const useRasterLoop = ({ applyFilter, clearFilter, activeLayerIds }) => {
    const { loadingLayers } = useLayerLoading();
    const [rasterLoops, setRasterLoops] = useState({});
    const loopDataRef = useRef({});
    const timersRef = useRef(new Map());
    const appliedDefaultsRef = useRef(new Set());
    const refs = useRef({});
    refs.current.applyFilter = applyFilter;
    refs.current.loadingLayers = loadingLayers;

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

            if (refs.current.loadingLayers.has(layerId)) {
                timersRef.current.set(layerId, setTimeout(doTick, 100));
                return;
            }

            const { months, yearData } = data;
            const currentIdx = months.indexOf(data.currentMonth);
            const nextIdx = (currentIdx + 1) % months.length;
            const nextMonth = months[nextIdx];

            refs.current.applyFilter(layerId, 'date', yearData[nextMonth]);
            data.currentMonth = nextMonth;
            setRasterLoops(prev => ({
                ...prev,
                [layerId]: { ...prev[layerId], currentMonth: nextMonth }
            }));

            timersRef.current.set(layerId, setTimeout(doTick, 500));
        };

        timersRef.current.set(layerId, setTimeout(doTick, 500));
    }, [clearTimer]);

    const startLoop = useCallback((layerId, year, periodicityData) => {
        const yearData = periodicityData?.[year];
        if (!yearData || typeof yearData === 'string') return;

        const months = Object.keys(yearData).map(Number).sort((a, b) => a - b);
        if (months.length === 0) return;

        const existing = loopDataRef.current[layerId];
        const startMonth = existing?.currentMonth != null && months.includes(existing.currentMonth)
            ? existing.currentMonth
            : months[0];

        const data = { isPlaying: true, currentMonth: startMonth, year, months, yearData };
        loopDataRef.current[layerId] = data;

        setRasterLoops(prev => ({
            ...prev,
            [layerId]: { isPlaying: true, currentMonth: startMonth, year, months }
        }));

        runNextTick(layerId);
    }, [runNextTick]);

    const stopLoop = useCallback((layerId) => {
        const data = loopDataRef.current[layerId];
        if (data) data.isPlaying = false;
        clearTimer(layerId);

        setRasterLoops(prev => {
            if (!prev[layerId]) return prev;
            return { ...prev, [layerId]: { ...prev[layerId], isPlaying: false } };
        });
    }, [clearTimer]);

    const toggleLoop = useCallback((layerId) => {
        const data = loopDataRef.current[layerId];
        if (!data) return;

        if (data.isPlaying) {
            stopLoop(layerId);
            trackRasterLoop(layerId, false);
        } else {
            const layerDef = findLayerDef(layerId, allLayers);
            const periodicityData = layerDef?.rasterPeriodicity;
            if (periodicityData) {
                startLoop(layerId, data.year, periodicityData);
                trackRasterLoop(layerId, true);
            }
        }
    }, [startLoop, stopLoop]);

    const cleanupLoop = useCallback((layerId) => {
        stopLoop(layerId);
        delete loopDataRef.current[layerId];

        setRasterLoops(prev => {
            const next = { ...prev };
            delete next[layerId];
            return next;
        });

        clearFilter(layerId, 'date');
    }, [stopLoop, clearFilter]);

    const getLoopState = useCallback((layerId) => {
        return rasterLoops[layerId] || null;
    }, [rasterLoops]);

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
        Object.keys(rasterLoops).forEach(layerId => {
            if (!activeLayerIds.includes(layerId)) {
                cleanupLoop(layerId);
            }
        });
    }, [activeLayerIds, rasterLoops, cleanupLoop]);

    return { rasterLoops, startLoop, stopLoop, toggleLoop, cleanupLoop, getLoopState };
};
