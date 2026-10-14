import { findLayerDef } from './wmsConfig';
import { buildLoopValues, describeDateFilter, findLoopStartKey, isSameLoopConfig } from './dateLoopHelpers';
import { dateColumnOf } from '@services/layerMetadataService';

export const DEFAULT_LOOP_INTERVAL_MS = 1000;
export const LOOP_INTERVAL_PRESETS = [250, 500, 1000, 2000, 3000];
export const DEFAULT_LOOP_DIRECTION = 'ltr';

export const SLOTS = ['A', 'B'];
export const clampIntervalMs = (ms) => Math.max(100, Math.min(10000, Number(ms) || DEFAULT_LOOP_INTERVAL_MS));
export const normalizeDirection = (dir) => (dir === 'rtl' ? 'rtl' : 'ltr');
export const loopKeyOf = (layerId, slot) => (slot ? `${layerId}|${slot}` : layerId);

export const currentSlot = (r) => (r.compareMode?.active ? r.compareMode.activeSlot : null);

export const resolveRaster = (r, layerId) => r.getRasterPeriodicity?.(layerId)
    ?? findLayerDef(layerId, r.allLayers)?.rasterPeriodicity
    ?? null;

export const readFilter = (r, layerId, slot) => {
    const cm = r.compareMode;
    if (slot && cm?.active && slot !== cm.activeSlot) return cm[`pane${slot}`]?.filters?.[layerId]?.date || null;
    return r.getSpecificFilter?.(layerId, 'date') || null;
};

export const writeFilter = (r, layerId, slot, value) => {
    if (slot && r.compareMode?.active) {
        r.applyFilterToSlot?.(layerId, slot, 'date', value);
        return;
    }
    r.applyFilter(layerId, 'date', value);
};

export const isPlaying = (loop) => !!loop?.player.getSnapshot().playing;

export const canResume = (r, loop, preferred) => {
    if (!loop || isPlaying(loop)) return false;
    if (preferred && !isSameLoopConfig(preferred, loop)) return false;
    const current = loop.values.find(v => v.key === loop.currentKey());
    return !!current && current.filterValue === readFilter(r, loop.layerId, loop.slot);
};

export const startKeyOf = (r, layerId, slot, config) => findLoopStartKey({
    ...config, year: config.year ?? null,
    filter: readFilter(r, layerId, slot),
    rasterPeriodicity: resolveRaster(r, layerId),
});

export const stateOf = (loop) => ({
    layerId: loop.layerId,
    isPlaying: isPlaying(loop),
    currentKey: loop.currentKey(),
    mode: loop.mode,
    year: loop.year,
    slot: loop.slot,
});

export const inferLoopConfigOf = (r, layerId, slot) => {
    const rasterPeriodicity = resolveRaster(r, layerId);
    const periodicity = r.getPeriodicity?.(layerId) || null;
    const filterColumn = dateColumnOf(layerId);
    const desc = describeDateFilter({ filter: readFilter(r, layerId, slot), rasterPeriodicity });

    if (desc && !desc.multi && desc.months?.length >= 1) {
        const values = buildLoopValues({
            mode: 'month', year: desc.year, filterColumn,
            rasterPeriodicity, periodicity,
            monthsSelection: new Set(desc.months)
        });
        if (values.length >= 2) return { mode: 'month', year: desc.year, values };
    }

    const yearValues = buildLoopValues({ mode: 'year', rasterPeriodicity, periodicity, filterColumn });
    if (yearValues.length >= 2) return { mode: 'year', values: yearValues };

    if (desc && !desc.multi) {
        const values = buildLoopValues({ mode: 'month', year: desc.year, rasterPeriodicity, periodicity, filterColumn });
        if (values.length >= 2) return { mode: 'month', year: desc.year, values };
    }

    return null;
};
