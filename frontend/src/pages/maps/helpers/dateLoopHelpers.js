import { generateCQLFilter, parseCQLToSelections, MONTHS } from './dateFilterHelpers';

const pickPeriodicitySource = ({ rasterPeriodicity, periodicity }) => {
    if (rasterPeriodicity) return rasterPeriodicity;
    if (!periodicity) return null;
    return periodicity.fecha || periodicity;
};

export const describeDateFilter = ({ filter, rasterPeriodicity }) => {
    if (!filter) return null;

    if (rasterPeriodicity) {
        for (const [yStr, yData] of Object.entries(rasterPeriodicity)) {
            const year = parseInt(yStr);
            if (typeof yData === 'string') {
                if (yData === filter) return { year, months: [], annual: true };
            } else if (yData && typeof yData === 'object') {
                for (const [mStr, v] of Object.entries(yData)) {
                    if (v === filter) return { year, months: [parseInt(mStr)], annual: false };
                }
            }
        }
        return null;
    }

    const selections = parseCQLToSelections(filter);
    if (selections.size === 0) return null;

    const years = new Set();
    const monthsByYear = {};
    for (const s of selections) {
        const parts = s.split('-');
        const year = parseInt(parts[0]);
        years.add(year);
        if (parts.length >= 2) {
            if (!monthsByYear[year]) monthsByYear[year] = new Set();
            monthsByYear[year].add(parseInt(parts[1]));
        }
    }

    if (years.size > 1) return { multi: true, yearCount: years.size };

    const year = [...years][0];
    const months = [...(monthsByYear[year] || new Set())].sort((a, b) => a - b);
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

export const formatLoopLabelLong = (desc) => {
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
        return `${names.join(', ')} de ${desc.year}`;
    }
    return `${desc.year}`;
};

export const computeSelectorInitialState = ({ isRaster, rasterPeriodicity, currentFilter }) => {
    if (isRaster) {
        if (!rasterPeriodicity) return { year: null, months: new Set() };
        if (currentFilter) {
            for (const [y, yData] of Object.entries(rasterPeriodicity)) {
                if (typeof yData === 'string' && yData === currentFilter) {
                    return { year: parseInt(y), months: new Set() };
                }
                if (yData && typeof yData === 'object') {
                    for (const [m, v] of Object.entries(yData)) {
                        if (v === currentFilter) return { year: parseInt(y), months: new Set([parseInt(m)]) };
                    }
                }
            }
        }
        const years = Object.keys(rasterPeriodicity).map(Number).sort((a, b) => b - a);
        return { year: years[0] || null, months: new Set() };
    }

    const parsed = parseCQLToSelections(currentFilter);
    let year = null;
    const months = new Set();
    for (const sel of parsed) {
        const parts = sel.split('-');
        if (parts.length >= 2) {
            year = parseInt(parts[0]);
            months.add(parseInt(parts[1]));
        } else if (parts.length === 1) {
            year = parseInt(parts[0]);
        }
    }
    return { year, months };
};

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
