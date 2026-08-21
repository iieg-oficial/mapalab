import { describeDateFilter } from '../pages/maps/helpers/dateLoopHelpers';
import { cqlToDateRange } from '../pages/maps/helpers/dateFilterHelpers';

const ISO_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

const pad = (value) => String(value).padStart(2, '0');

const formatDescription = (desc) => {
    if (!desc || desc.multi) return null;
    if (!desc.months?.length) return `${desc.year}`;
    const months = [...desc.months].sort((a, b) => a - b);
    const first = `${desc.year}-${pad(months[0])}`;
    if (months.length === 1) return first;
    return `${first}_a_${desc.year}-${pad(months[months.length - 1])}`;
};

const formatRange = (range) => {
    if (!range?.dateFrom || !range?.dateTo) return null;
    return range.dateFrom === range.dateTo ? range.dateFrom : `${range.dateFrom}_a_${range.dateTo}`;
};

export const resolveFilterDateLabel = ({ filter, rasterPeriodicity = null }) => {
    if (!filter) return null;
    const described = formatDescription(describeDateFilter({ filter, rasterPeriodicity }));
    if (described) return described;
    const ranged = formatRange(cqlToDateRange(filter));
    if (ranged) return ranged;
    return ISO_DATE.test(filter) ? filter : null;
};

export const buildFilename = (label, extension, { filter = null, rasterPeriodicity = null } = {}) => {
    const name = String(label || 'capa').trim().replace(/\s+/g, '_');
    const date = resolveFilterDateLabel({ filter, rasterPeriodicity })
        || new Date().toISOString().slice(0, 10);
    return `${name}_${date}.${extension}`;
};
