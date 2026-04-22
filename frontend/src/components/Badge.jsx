import { useFeatureSeen } from '@hooks/useFeatureSeen';

const SOLID_COLORS = {
    orange: 'bg-[#FF8300]',
    purple: 'bg-[#70308A]',
    pink: 'bg-[#FF577D]',
    violet: 'bg-[#5C2472]'
};

const SOFT_COLORS = {
    orange: 'bg-[#FFF2E5] text-[#FF8300]',
    purple: 'bg-[#F4EFF9] text-[#70308A]',
    pink: 'bg-[#FFEBF1] text-[#FF577D]',
    violet: 'bg-[#F4EFF9] text-[#5C2472]'
};

const SIZE_CLASSES = {
    sm: 'size-3.5 text-[8px]',
    md: 'size-5 text-[8px]'
};

const PILL_BASE = 'shrink-0 px-2 py-0.5 text-[10px]/[16px] tabular-nums';

const Badge = ({
    count,
    text,
    variant = 'count',
    visible = true,
    color = 'orange',
    size = 'md',
    featureKey,
    onClick,
    className = ''
}) => {
    const [seen, markSeen] = useFeatureSeen(featureKey);

    const isPill = variant === 'pill';
    const rawContent = isPill ? text : count;
    const hasContent = rawContent !== undefined && rawContent !== null && rawContent !== '';

    if (!visible) return null;
    if (featureKey && seen) return null;
    if (!featureKey && !hasContent) return null;

    const clickable = Boolean(featureKey || onClick);
    const handleClick = clickable
        ? (e) => {
            if (featureKey) markSeen();
            onClick?.(e);
        }
        : undefined;

    const styleClass = isPill
        ? `${PILL_BASE} ${SOFT_COLORS[color] || SOFT_COLORS.violet}`
        : `${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${SOLID_COLORS[color] || SOLID_COLORS.orange} text-white`;

    const classes = [
        'rounded-full font-garet font-bold flex items-center justify-center leading-none',
        styleClass,
        clickable ? 'cursor-pointer' : '',
        className
    ].filter(Boolean).join(' ');

    if (clickable) {
        return (
            <button type="button" onClick={handleClick} className={classes}>
                {hasContent ? rawContent : ''}
            </button>
        );
    }

    return (
        <span className={classes}>
            {hasContent ? rawContent : ''}
        </span>
    );
};

export default Badge;
