import { dateFilterOfKeys, dateKeysFromFilter, dateRangeOfKeys, keyToSelection, selectionToKey } from './dateKeys';

export const generateCQLFilter = (selections, filterColumn = 'fecha') => {
    if (!selections || selections.size === 0) return null;
    return dateFilterOfKeys([...selections].map(selectionToKey), filterColumn);
};

export const parseCQLToSelections = (cqlFilter) => new Set(dateKeysFromFilter(cqlFilter).map(keyToSelection));

export const cqlToDateRange = (cqlFilter) => dateRangeOfKeys(dateKeysFromFilter(cqlFilter));

export const generateDefaultDateFilter = (defaultDate, filterColumn = 'fecha') => {
    if (!defaultDate) return null;

    const toArray = (val) => Array.isArray(val) ? val : [val];
    const years = toArray(defaultDate.year);
    const selections = new Set();

    if (defaultDate.day != null) {
        const months = toArray(defaultDate.month);
        const days = toArray(defaultDate.day);
        for (const y of years) {
            for (const m of months) {
                for (const d of days) {
                    selections.add(`${y}-${m}-${d}`);
                }
            }
        }
    } else if (defaultDate.month != null) {
        const months = toArray(defaultDate.month);
        for (const y of years) {
            for (const m of months) {
                selections.add(`${y}-${m}`);
            }
        }
    } else {
        for (const y of years) {
            selections.add(`${y}`);
        }
    }

    return generateCQLFilter(selections, filterColumn);
};

export const formatDateString = (dateString) => {
    if (!dateString) return 'N/A';
    const str = String(dateString).trim();
    if (/^\d{4}$/.test(str)) return str;

    const parts = str.split('-');
    if (parts.length >= 2) {
        const year = parts[0];
        const month = MONTHS.find(m => m.num === parseInt(parts[1]));
        const monthName = (month?.name || parts[1]).toLowerCase();
        if (parts.length >= 3 && parseInt(parts[2]) > 0) {
            return `${parseInt(parts[2])} de ${monthName} de ${year}`;
        }
        return `${monthName} ${year}`;
    }

    return str;
};

export const MONTHS = [
    { num: 1, name: 'Enero', shortName: 'EN' },
    { num: 2, name: 'Febrero', shortName: 'FE' },
    { num: 3, name: 'Marzo', shortName: 'MA' },
    { num: 4, name: 'Abril', shortName: 'AB' },
    { num: 5, name: 'Mayo', shortName: 'MY' },
    { num: 6, name: 'Junio', shortName: 'JN' },
    { num: 7, name: 'Julio', shortName: 'JL' },
    { num: 8, name: 'Agosto', shortName: 'AG' },
    { num: 9, name: 'Septiembre', shortName: 'SE' },
    { num: 10, name: 'Octubre', shortName: 'OC' },
    { num: 11, name: 'Noviembre', shortName: 'NO' },
    { num: 12, name: 'Diciembre', shortName: 'DI' }
];

export const formatIsoAsMonthYear = (isoDate) => {
    if (!isoDate || typeof isoDate !== 'string') return null;
    const parts = isoDate.split('-');
    if (parts.length < 2) return null;
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthName = MONTHS.find(m => m.num === monthNum)?.name || '';
    return `${monthName} ${year}`.trim();
};
