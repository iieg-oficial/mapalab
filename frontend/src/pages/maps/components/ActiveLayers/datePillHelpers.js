import { describeDateFilter, formatLoopLabel } from '@pages/maps/helpers/dateLoopHelpers';

export const LABEL_WIDTHS = {
    'year': 'w-[40px]',
    'month-year': 'w-[60px]',
    'multi-year': 'w-[50px]',
    'multi-month': 'w-[86px]',
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
