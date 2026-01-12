import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const UndoButton = ({
    onClick,
    disabled = false,
    className = '',
    label = 'Deshacer',
    tooltip = 'Deshacer último punto',
    showLabel = true,
    placement = 'right'
}) => {
    const baseClasses = [
        'flex items-center rounded-r-[8px] border border-transparent transition-all',
        showLabel ? 'gap-2 px-3 py-1 justify-center' : 'p-1 justify-end w-15',
        disabled
            ? 'bg-[#EAEFFA] text-[#703089]/40 cursor-not-allowed'
            : 'bg-white text-[#703089] hover:border-[#5C2472] active:bg-[#703089] active:text-white'
    ].concat(className).join(' ').trim();

    return (
        <Tooltip content={tooltip} placement={placement} delay={300}>
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={baseClasses}
                aria-label={tooltip}
            >
                <Icon name="deshacer" state="normal" className="size-7.5 shrink-0 min-w-[30px] min-h-[30px]" />
                {showLabel && <span className="text-xs font-semibold">{label}</span>}
            </button>
        </Tooltip>
    );
};

export default UndoButton;
