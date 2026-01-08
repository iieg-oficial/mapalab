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
        'flex items-center gap-2 px-3 py-1.5 rounded-full border border-transparent transition-all',
        disabled
            ? 'bg-[#EAEFFA]/60 text-[#703089]/40 cursor-not-allowed'
            : 'bg-[#EAEFFA] text-[#703089] hover:border-[#5C2472] active:bg-[#703089] active:text-white'
    ]
        .concat(className)
        .join(' ')
        .trim();

    return (
        <Tooltip content={tooltip} placement={placement} delay={300}>
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={baseClasses}
                aria-label={tooltip}
            >
                <Icon name="undo" />
                {showLabel && <span className="text-xs font-semibold">{label}</span>}
            </button>
        </Tooltip>
    );
};

export default UndoButton;
