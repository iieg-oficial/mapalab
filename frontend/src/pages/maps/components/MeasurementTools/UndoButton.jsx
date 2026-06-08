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
        'flex items-center justify-center border border-transparent transition-all',
        showLabel
            ? 'h-12.5 gap-2 px-3 rounded-[8px] bg-white'
            : 'size-8 rounded-full',
        disabled
            ? (showLabel ? 'bg-[#EAEFFA] text-purple-deep/40 cursor-not-allowed' : 'text-purple-deep/40 cursor-not-allowed')
            : 'text-purple-deep hover:border-purple active:bg-purple-deep active:text-white'
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
                <Icon name="deshacer" state="normal" className="size-5.5 shrink-0" />
                {showLabel && <span className="text-xs font-semibold">{label}</span>}
            </button>
        </Tooltip>
    );
};

export default UndoButton;
