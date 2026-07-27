import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { SLOT_PILL, getLabelWidthClass } from './datePillHelpers';

const SIZE_CLASSES = {
    sm: 'h-[22px] px-2 text-[10px]',
    md: 'h-7 px-2.5 text-[11px]',
    lg: 'h-6 px-2 text-[10px] w-[64px]',
};

const DatePill = ({ slot, label, kind, onClick, isLoopingPulse, isLooping = false, size = 'sm', autoWidth = false }) => {
    const palette = SLOT_PILL[slot] || SLOT_PILL.none;
    const widthClass = (autoWidth || size === 'lg') ? '' : getLabelWidthClass(kind, isLooping);
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
    return (
        <Tooltip content={slot === 'none' ? 'Ver detalles de capa' : `Fecha del lado ${slot}${isLooping ? ' (en animación)' : ''}`}>
            <button
                onClick={onClick}
                className={`flex items-center justify-center gap-1 rounded-full border font-garet font-bold shrink-0 transition-all tabular-nums ${sizeClass} ${palette.bg} ${palette.border} ${palette.text} ${palette.hover} ${widthClass} ${isLoopingPulse ? 'animate-pulse' : ''}`}
            >
                {isLooping && <Icon name="play" className="size-2.5 shrink-0" />}
                <span className="whitespace-nowrap">{label}</span>
            </button>
        </Tooltip>
    );
};

export default DatePill;
