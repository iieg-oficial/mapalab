import { parseKey } from 'zootropo';
import { generateCQLFilter, MONTHS } from './dateFilterHelpers';
import { dateKeysFromFilter } from './dateKeys';

const pickPeriodicitySource = ({ rasterPeriodicity, periodicity }) => {
    if (rasterPeriodicity) return rasterPeriodicity;
    if (!periodicity) return null;
    return periodicity.fecha || periodicity;
};

export const describeDateFilter = ({ filter, rasterPeriodicity }) => {
    const keys = dateKeysFromFilter(filter, { rasterPeriodicity });
    if (keys.length === 0) return null;
    const parts = keys.map(parseKey);
    const years = new Set(parts.map(part => part.year));
    if (years.size > 1) return { multi: true, yearCount: years.size };
    const year = parts[0].year;
    const months = [...new Set(parts.map(part => part.month).filter(month => month !== null))].sort((a, b) => a - b);
    return { year, months, annual: months.length === 0 };
};

export const formatLoopLabel = (desc) => {
    if (!desc) return null;
    if (desc.multi) return `${desc.yearCount} AÑOS`;
    if (desc.months?.length === 1) {
        const abbr = MONTHS.find(m => m.num === desc.months[0])?.name.slice(0, 3).toUpperCase();
        return `${abbr} ${desc.year}`;
    }
    if (desc.months?.length > 1) return `${desc.months.length} MESES ${desc.year}`;
    return `${desc.year}`;
};

const MAX_LISTED_MONTHS = 3;

const isContiguous = (months) => months.every((m, i) => i === 0 || m === months[i - 1] + 1);

export const formatLoopLabelLong = (desc, { maxMonths = Infinity } = {}) => {
    if (!desc) return null;
    if (desc.multi) return `${desc.yearCount} años`;
    if (desc.months?.length === 1) {
        const fullName = MONTHS.find(m => m.num === desc.months[0])?.name;
        return `${fullName} de ${desc.year}`;
    }
    if (desc.months?.length > 1) {
        const names = desc.months
            .map(n => MONTHS.find(m => m.num === n)?.name)
            .filter(Boolean);
        if (names.length > maxMonths) {
            return isContiguous(desc.months)
                ? `${names[0]} a ${names[names.length - 1]} de ${desc.year}`
                : `${names.length} meses de ${desc.year}`;
        }
        return `${names.join(', ')} de ${desc.year}`;
    }
    return `${desc.year}`;
};

export const formatDateFilterPill = (desc) => formatLoopLabelLong(desc, { maxMonths: MAX_LISTED_MONTHS });

export const buildLoopValues = ({ mode, year, rasterPeriodicity = null, periodicity = null, monthsSelection = null, filterColumn = 'fecha' }) => {
    const isRaster = !!rasterPeriodicity;
    const src = pickPeriodicitySource({ rasterPeriodicity, periodicity });
    if (!src) return [];

    if (mode === 'year') {
        const years = Object.keys(src).map(Number).sort((a, b) => b - a);
        if (years.length < 2) return [];
        const values = years.map(y => {
            const yData = src[y];
            let filterValue = null;
            if (isRaster) {
                if (typeof yData === 'string') {
                    filterValue = yData;
                } else if (yData && typeof yData === 'object') {
                    const months = Object.keys(yData).map(Number).sort((a, b) => a - b);
                    filterValue = months.length ? yData[months[0]] : null;
                }
            } else {
                filterValue = generateCQLFilter(new Set([`${y}`]), filterColumn);
            }
            return { key: y, filterValue };
        }).filter(v => v.filterValue != null);
        return values.length >= 2 ? values : [];
    }

    if (mode === 'month' && year != null) {
        const yData = src[year];
        if (!yData || typeof yData === 'string') return [];

        let months = Object.keys(yData).map(Number).sort((a, b) => a - b);
        if (monthsSelection && monthsSelection.size >= 2) {
            const selected = months.filter(m => monthsSelection.has(m));
            if (selected.length >= 2) months = selected;
        }
        if (months.length < 2) return [];

        const values = months.map(m => {
            const filterValue = isRaster
                ? yData[m]
                : generateCQLFilter(new Set([`${year}-${m}`]), filterColumn);
            return { key: m, filterValue };
        }).filter(v => v.filterValue != null);
        return values.length >= 2 ? values : [];
    }

    return [];
};

export const findLoopStartKey = ({ values, mode, year = null, filter, rasterPeriodicity = null }) => {
    if (!filter || !values?.length) return null;
    const exact = values.find(v => v.filterValue === filter);
    if (exact) return exact.key;
    const desc = describeDateFilter({ filter, rasterPeriodicity });
    if (!desc || desc.multi) return null;
    if (mode === 'month' && desc.year !== year) return null;
    const key = mode === 'year' ? desc.year : desc.months?.[0];
    return values.some(v => v.key === key) ? key : null;
};

export const isSameLoopConfig = (a, b) => a?.mode === b?.mode && (a?.year ?? null) === (b?.year ?? null);
