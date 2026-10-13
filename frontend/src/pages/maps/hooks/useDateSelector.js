import { useEffect, useMemo, useRef, useState } from 'react';
import { createTimePlayer, parseKey, toKey } from 'zootropo';
import { useTimePlayer } from 'zootropo/react';
import { dateKeysFromFilter } from '../helpers/dateKeys';

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

const sameKeys = (a, b) => a.length === b.length && a.every((key, index) => key === b[index]);

export const useDateSelector = ({ fecha, filterColumn, isRaster, singleSelectOnly, currentFilter, onApply, onClear }) => {
    const rasterPeriodicity = isRaster ? fecha : null;
    const [initialKeys] = useState(() => dateKeysFromFilter(currentFilter, { rasterPeriodicity }));
    const player = useMemo(() => createTimePlayer({
        catalog: catalogKeysOf(fecha, isRaster),
        kind: isRaster ? 'time' : 'cql',
        column: filterColumn || 'fecha',
        multiple: !isRaster && !singleSelectOnly,
        initial: initialKeys,
    }), [fecha, isRaster, singleSelectOnly, filterColumn, initialKeys]);

    useEffect(() => {
        const first = player.getSnapshot().selection[0];
        if (first) player.open(toKey(parseKey(first).year));
    }, [player]);

    const t = useTimePlayer(player, { openOnSelect: NO_OPEN });
    const callbacks = useRef({});
    callbacks.current = { onApply, onClear };
    const previousFilter = useRef(currentFilter);

    useEffect(() => {
        const keys = dateKeysFromFilter(currentFilter, { rasterPeriodicity });
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
    }, [currentFilter, player, rasterPeriodicity]);

    const { selection, cql } = t;
    useEffect(() => {
        const applied = dateKeysFromFilter(previousFilter.current, { rasterPeriodicity });
        if (sameKeys(applied, selection)) return;
        if (selection.length === 0) {
            callbacks.current.onClear?.();
            return;
        }
        const value = isRaster ? rasterValueOf(fecha, selection[0]) : cql;
        if (value) callbacks.current.onApply?.(value, selection);
    }, [selection, cql, isRaster, fecha, rasterPeriodicity]);

    const first = selection[0] ? parseKey(selection[0]) : null;
    const selectedYear = first?.year ?? null;
    const selectedMonths = new Set(selection.map(key => parseKey(key).month).filter(month => month !== null));
    const expandedYear = t.view.level === 'years' ? null : t.view.year;

    return { t, player, selectedYear, selectedMonths, expandedYear };
};
