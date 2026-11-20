import { cqlValue, endAt, keyOfAt, parseInstant, parseKey, shiftKey, sortKeys, startAt, toKey } from 'zootropo';

const DAY_MS = 86400000;
const MAX_KEYS = 5000;
const COMPARISON = /([A-Za-z_]\w*|"(?:[^"]|"")+")\s*(>=|<|=)\s*'([^']+)'/g;
const GRANULARITIES = ['year', 'month', 'day', 'hour'];

const atOf = (text) => parseInstant(text)?.at ?? null;

const keysOfRange = (from, to) => {
    for (const granularity of GRANULARITIES) {
        let key = keyOfAt(from, granularity);
        if (startAt(key) !== from) continue;
        const keys = [];
        while (startAt(key) < to && keys.length < MAX_KEYS) {
            keys.push(key);
            key = shiftKey(key, 1);
        }
        if (startAt(key) === to) return keys;
    }
    return [];
};

const rangesOfCql = (cql) => {
    const ranges = [];
    let pending = null;
    for (const [, , operator, literal] of cql.matchAll(COMPARISON)) {
        const at = atOf(literal);
        if (at === null) continue;
        if (operator === '>=') pending = at;
        else if (operator === '<' && pending !== null) {
            ranges.push([pending, at]);
            pending = null;
        } else if (operator === '=') ranges.push([at, at + DAY_MS]);
    }
    return ranges;
};

const keysOfRaster = (filter, rasterPeriodicity) => {
    for (const [yearText, yearData] of Object.entries(rasterPeriodicity)) {
        const year = Number(yearText);
        if (typeof yearData === 'string' && yearData === filter) return [toKey(year)];
        if (yearData && typeof yearData === 'object') {
            for (const [monthText, value] of Object.entries(yearData)) {
                if (value === filter) return [toKey(year, Number(monthText))];
            }
        }
    }
    return [];
};

export const dateKeysFromFilter = (filter, { rasterPeriodicity = null } = {}) => {
    if (!filter || typeof filter !== 'string') return [];
    if (rasterPeriodicity) return keysOfRaster(filter, rasterPeriodicity);
    return sortKeys(rangesOfCql(filter).flatMap(([from, to]) => keysOfRange(from, to)));
};

export const keysInCatalog = (keys, catalogKeys) => {
    const catalog = new Set(catalogKeys);
    return sortKeys([...new Set(keys.flatMap((key) => {
        if (catalog.has(key)) return [key];
        const from = startAt(key);
        const to = endAt(key);
        return catalogKeys.filter(inner => startAt(inner) >= from && endAt(inner) <= to);
    }))]);
};

export const selectionToKey = (selection) => {
    const [year, month, day] = String(selection).split('-').map(Number);
    return toKey(year, Number.isFinite(month) ? month : null, Number.isFinite(day) ? day : null);
};

export const keyToSelection = (key) => {
    const { year, month, day } = parseKey(key);
    return [year, month, day].filter(part => part !== null).join('-');
};

export const dateFilterOfKeys = (keys, column = 'fecha') => cqlValue(column, keys);

export const dateRangeOfKeys = (keys) => {
    if (!keys.length) return null;
    const sorted = sortKeys(keys);
    const iso = (at) => new Date(at).toISOString().slice(0, 10);
    return {
        dateFrom: iso(startAt(sorted[0])),
        dateTo: iso(Math.max(...sorted.map(endAt)) - 1),
    };
};
