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
        'flex items-center gap-2 px-3 py-1.5 rounded-xl shadow backdrop-blur-sm border border-white/60',
        disabled
            ? 'bg-white/60  text-gray-400 cursor-not-allowed opacity-80'
            : 'bg-white/90  text-gray-800  hover:bg-blue-50'
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
