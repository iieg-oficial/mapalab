import { describeDateFilter, formatLoopLabel, formatLoopLabelLong } from '@pages/maps/helpers/dateLoopHelpers';

const LABEL_WIDTHS = {
    'year': { normal: 'w-[40px]', withPlay: 'w-[54px]' },
    'month-year': { normal: 'w-[72px]', withPlay: 'w-[86px]' },
    'multi-year': { normal: 'w-[50px]', withPlay: 'w-[64px]' },
    'multi-month': { normal: 'w-[100px]', withPlay: 'w-[114px]' },
};

export const getLabelWidthClass = (kind, withPlay = false) => {
    const entry = LABEL_WIDTHS[kind];
    if (!entry) return withPlay ? 'min-w-[62px]' : 'min-w-[48px]';
    return withPlay ? entry.withPlay : entry.normal;
};

export const SLOT_PILL = {
    A: { bg: 'bg-[#F2EBFA]', border: 'border-[#5C2472]', text: 'text-[#5C2472]', hover: 'hover:bg-[#E2D1EB]' },
    B: { bg: 'bg-[#FFF2E5]', border: 'border-[#FF8300]', text: 'text-[#FF8300]', hover: 'hover:bg-[#FFE4C4]' },
    none: { bg: 'bg-[#FFF2E5]', border: 'border-[#FF8300]', text: 'text-[#FF8300]', hover: 'hover:bg-[#FFE4C4]' },
};

export const computeLabel = (filter, rasterPeriodicity) => {
    const desc = describeDateFilter({ filter, rasterPeriodicity });
    const label = formatLoopLabel(desc);
    let kind = null;
    if (desc) {
        if (desc.multi) kind = 'multi-year';
        else if (desc.annual || !desc.months?.length) kind = 'year';
        else if (desc.months.length === 1) kind = 'month-year';
        else kind = 'multi-month';
    }
    return { label, kind };
};

export const computeLabelLong = (filter, rasterPeriodicity) => {
    const desc = describeDateFilter({ filter, rasterPeriodicity });
    return { label: formatLoopLabelLong(desc) };
};
