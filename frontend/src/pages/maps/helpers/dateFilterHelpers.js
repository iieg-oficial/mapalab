export const generateCQLFilter = (selections, filterColumn = 'fecha') => {
    if (!selections || selections.size === 0) return null;

    const filters = [];

    selections.forEach(selection => {
        const parts = selection.split('-');

        if (parts.length === 3) {
            const [year, month, day] = parts;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            filters.push(`${filterColumn} = '${dateStr}'`);
        } else if (parts.length === 2) {
            const [year, month] = parts;
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);

            const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
            const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
            const nextYear = monthNum === 12 ? yearNum + 1 : yearNum;
            const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            filters.push(`(${filterColumn} >= '${startDate}' AND ${filterColumn} < '${endDate}')`);
        } else if (parts.length === 1) {
            const year = parts[0];
            const startDate = `${year}-01-01`;
            const endDate = `${parseInt(year) + 1}-01-01`;
            filters.push(`(${filterColumn} >= '${startDate}' AND ${filterColumn} < '${endDate}')`);
        }
    });

    if (filters.length === 0) return null;
    if (filters.length === 1) return filters[0];

    return `(${filters.join(' OR ')})`;
};

export const parseCQLToSelections = (cqlFilter) => {
    if (!cqlFilter) return new Set();

    const selections = new Set();
    const cleanFilter = cqlFilter.startsWith('(') && cqlFilter.endsWith(')')
        ? cqlFilter.slice(1, -1)
        : cqlFilter;

    const parts = cleanFilter.split(' OR ');

    parts.forEach(part => {
        const p = part.trim().replace(/^\(+|\)+$/g, '');

        const dayMatch = p.match(/fecha\s*=\s*'(\d{4}-\d{2}-\d{2})'/);
        if (dayMatch) {
            const [y, m, d] = dayMatch[1].split('-');
            selections.add(`${y}-${parseInt(m)}-${parseInt(d)}`);
            return;
        }

        const rangeMatch = p.match(/fecha\s*>=\s*'(\d{4})-(\d{2})-\d{2}'/);
        if (rangeMatch) {
            const [_, y, m] = rangeMatch;

            const endMatch = p.match(/fecha\s*<\s*'(\d{4})-(\d{2})-\d{2}'/);
            if (endMatch) {
                const [__, endY, endM] = endMatch;

                if (m === '01' && endM === '01' && parseInt(endY) === parseInt(y) + 1) {
                    selections.add(y);
                } else {
                    selections.add(`${y}-${parseInt(m)}`);
                }
            }
        }
    });

    return selections;
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
