import { useEffect, useMemo, useRef, useState } from 'react';
import { createTimePlayer, parseKey, toKey } from 'zootropo';
import { useTimePlayer } from 'zootropo/react';
import { dateKeysFromFilter, keyToSelection, keysInCatalog } from '../helpers/dateKeys';

const NO_OPEN = [];

export const catalogKeysOf = (fecha, isRaster) => Object.entries(fecha || {}).flatMap(([yearText, yearData]) => {
    const year = Number(yearText);
    if (!yearData || typeof yearData !== 'object') return [toKey(year)];
    const months = Object.keys(yearData).map(Number);
    if (months.length === 0) return [toKey(year)];
    return months.flatMap(month => {
        const days = !isRaster && Array.isArray(yearData[month]) ? yearData[month].map(Number) : [];
        return days.length ? days.map(day => toKey(year, month, day)) : [toKey(year, month)];
    });
});

const rasterValueOf = (fecha, key) => {
    if (!key) return null;
    const { year, month } = parseKey(key);
    const yearData = fecha?.[year];
    if (month === null) return typeof yearData === 'string' ? yearData : null;
    return yearData && typeof yearData === 'object' ? yearData[month] ?? null : null;
};

const appliedKeysOf = (filter, rasterPeriodicity, catalogKeys) => {
    const keys = dateKeysFromFilter(filter, { rasterPeriodicity });
    return rasterPeriodicity ? keys : keysInCatalog(keys, catalogKeys);
};

const selectionKeysOf = (filter, rasterPeriodicity, catalogKeys, single) => {
    const keys = appliedKeysOf(filter, rasterPeriodicity, catalogKeys);
    return single ? keys.slice(-1) : keys;
};

const sameKeys = (a, b) => a.length === b.length && a.every((key, index) => key === b[index]);

export const useDateSelector = ({ fecha, filterColumn, isRaster, singleSelectOnly, mixed = false, currentFilter, onApply, onClear }) => {
    const rasterPeriodicity = isRaster ? fecha : null;
    const single = isRaster || singleSelectOnly;
    const catalogKeys = useMemo(() => catalogKeysOf(fecha, isRaster), [fecha, isRaster]);
    const [initialFilter] = useState(currentFilter);
    const initialKeys = useMemo(
        () => selectionKeysOf(initialFilter, rasterPeriodicity, catalogKeys, single),
        [initialFilter, rasterPeriodicity, catalogKeys, single],
    );
    const player = useMemo(() => createTimePlayer({
        catalog: catalogKeys,
        kind: isRaster ? 'time' : 'cql',
        column: filterColumn || 'fecha',
        multiple: single ? false : (mixed ? 'mixed' : true),
        initial: initialKeys,
    }), [catalogKeys, isRaster, single, mixed, filterColumn, initialKeys]);

    useEffect(() => {
        const first = player.getSnapshot().selection[0];
        if (first) player.open(toKey(parseKey(first).year));
    }, [player]);

    const t = useTimePlayer(player, { openOnSelect: NO_OPEN });
    const callbacks = useRef({});
    callbacks.current = { onApply, onClear };
    const previousFilter = useRef(currentFilter);

    useEffect(() => {
        const keys = selectionKeysOf(currentFilter, rasterPeriodicity, catalogKeys, single);
        const hadFilter = previousFilter.current;
        previousFilter.current = currentFilter;
        if (!currentFilter) {
            if (hadFilter && player.getSnapshot().selection.length) {
                player.clearSelection();
                player.back();
                player.back();
            }
            return;
        }
        if (!sameKeys(keys, player.getSnapshot().selection)) player.setSelection(keys);
    }, [currentFilter, player, rasterPeriodicity, catalogKeys, single]);

    const { selection, cql } = t;
    useEffect(() => {
        const applied = appliedKeysOf(previousFilter.current, rasterPeriodicity, catalogKeys);
        if (sameKeys(applied, selection)) return;
        if (selection.length === 0) {
            callbacks.current.onClear?.();
            return;
        }
        const value = isRaster ? rasterValueOf(fecha, selection[0]) : cql;
        if (value) callbacks.current.onApply?.(value, selection.map(keyToSelection));
    }, [selection, cql, isRaster, fecha, rasterPeriodicity, catalogKeys]);

    const first = selection[0] ? parseKey(selection[0]) : null;
    const selectedYear = first?.year ?? null;
    const selectedMonths = new Set(selection.map(key => parseKey(key).month).filter(month => month !== null));
    const expandedYear = t.view.level === 'years' ? null : t.view.year;

    return { t, player, selectedYear, selectedMonths, expandedYear };
};
