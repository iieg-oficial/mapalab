import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { SLOT_PILL, getLabelWidthClass } from './datePillHelpers';
import { slotLabel } from '@pages/maps/helpers/swipeTheme';

const SIZE_CLASSES = {
    sm: 'h-[22px] px-2 text-[10px]',
    md: 'h-7 px-2.5 text-[11px]',
    lg: 'h-6 px-2 text-[10px] w-[64px]',
};

const DatePill = ({ slot, label, kind, onClick, isLoopingPulse, isLooping = false, size = 'sm', autoWidth = false, tooltip, expanded, onClear }) => {
    const palette = SLOT_PILL[slot] || SLOT_PILL.none;
    const widthClass = (autoWidth || size === 'lg') ? '' : getLabelWidthClass(kind, isLooping);
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
    if (onClear) {
        return (
            <div className={`flex items-center h-6 min-w-[64px] rounded-full border font-garet font-bold text-[10px] shrink-0 transition-all tabular-nums ${palette.bg} ${palette.border} ${palette.text} ${isLoopingPulse ? 'animate-pulse' : ''}`}>
                <Tooltip content={tooltip}>
                    <button type="button" onClick={onClick} aria-expanded={expanded} className={`h-6 pl-2 pr-1 flex items-center gap-1 rounded-l-full cursor-pointer ${palette.hover}`}>
                        {isLooping && <Icon name="play" className="size-2.5 shrink-0" />}
                        <span className="whitespace-nowrap">{label}</span>
                    </button>
                </Tooltip>
                <Tooltip content="Quitar el filtro de fecha">
                    <button type="button" onClick={onClear} aria-label="Quitar el filtro de fecha" className={`h-6 pl-0.5 pr-1.5 flex items-center rounded-r-full cursor-pointer ${palette.hover}`}>
                        <Icon name="close" className="size-3 shrink-0" />
                    </button>
                </Tooltip>
            </div>
        );
    }
    return (
        <Tooltip content={tooltip || (slot === 'none' ? 'Ver detalles de capa' : `Fecha del lado ${slotLabel(slot)}${isLooping ? ' (en animación)' : ''}`)}>
            <button
                onClick={onClick}
                aria-expanded={expanded}
                className={`flex items-center justify-center gap-1 rounded-full border font-garet font-bold shrink-0 transition-all tabular-nums ${sizeClass} ${palette.bg} ${palette.border} ${palette.text} ${palette.hover} ${widthClass} ${isLoopingPulse ? 'animate-pulse' : ''}`}
            >
                {isLooping && <Icon name="play" className="size-2.5 shrink-0" />}
                <span className="whitespace-nowrap">{label}</span>
            </button>
        </Tooltip>
    );
};

export default DatePill;
