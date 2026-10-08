import { useEffect, useRef } from 'react';
import { findLayerDef } from '../helpers/wmsConfig';

const SLOTS = ['A', 'B'];

const latestRasterValue = (rasterPeriodicity) => {
    const years = Object.keys(rasterPeriodicity || {}).map(Number).sort((a, b) => b - a);
    const yearData = rasterPeriodicity?.[years[0]];
    if (!yearData || typeof yearData !== 'object') return null;
    const months = Object.keys(yearData).map(Number).sort((a, b) => a - b);
    return yearData[months[months.length - 1]] || null;
};

export const useRasterDefaultDate = ({ activeLayerIds, allLayers, compareMode, getSpecificFilter, applyFilter, clearFilter, applyFilterToSlot }) => {
    const appliedRef = useRef(new Set());
    const refs = useRef({});
    refs.current = { getSpecificFilter, applyFilter, clearFilter, applyFilterToSlot };

    const compareActive = !!compareMode?.active;
    const activeSlot = compareMode?.activeSlot;
    const paneA = compareMode?.paneA;
    const paneB = compareMode?.paneB;

    useEffect(() => {
        const applied = appliedRef.current;
        const { getSpecificFilter: getLive, applyFilter: applyLive, clearFilter: clearLive, applyFilterToSlot: applySlot } = refs.current;

        const ensure = (key, layerId, currentFilter, write) => {
            if (applied.has(key)) return;
            const rasterPeriodicity = findLayerDef(layerId, allLayers)?.rasterPeriodicity;
            if (!rasterPeriodicity) return;
            if (!currentFilter) {
                const value = latestRasterValue(rasterPeriodicity);
                if (value) write(value);
            }
            applied.add(key);
        };

        if (!compareActive) {
            [...applied].forEach(key => { if (!key.startsWith('live|')) applied.delete(key); });
            activeLayerIds.forEach(id => ensure(`live|${id}`, id, getLive?.(id, 'date'), (v) => applyLive(id, 'date', v)));
            [...applied].forEach(key => {
                const id = key.slice(5);
                if (!activeLayerIds.includes(id)) {
                    applied.delete(key);
                    clearLive(id, 'date');
                }
            });
            return;
        }

        const panes = { A: paneA, B: paneB };
        SLOTS.forEach(slot => {
            const ids = panes[slot]?.activeLayerIds || [];
            ids.forEach(id => {
                const current = slot === activeSlot ? getLive?.(id, 'date') : panes[slot]?.filters?.[id]?.date;
                ensure(`${slot}|${id}`, id, current, (v) => applySlot?.(id, slot, 'date', v));
            });
            [...applied].forEach(key => {
                if (key.startsWith(`${slot}|`) && !ids.includes(key.slice(2))) applied.delete(key);
            });
        });
    }, [activeLayerIds, allLayers, compareActive, activeSlot, paneA, paneB]);
};
