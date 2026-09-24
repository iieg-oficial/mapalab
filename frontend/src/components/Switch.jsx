import Tooltip from '@components/Tooltip';

const Switch = ({ checked, indeterminate, onChange, disabled, className = '', onLabel, offLabel, onColor, offColor, tooltip, variant = 'default', ariaLabel }) => {
    const neutro = variant === 'neutro';
    const hasLabels = onLabel || offLabel;

    const getTranslateClass = () => {
        if (indeterminate) return 'translate-x-2';
        return checked ? 'translate-x-3' : 'translate-x-1';
    };

    const getBackgroundColor = () => {
        if (disabled) return 'bg-gray-300';
        if (indeterminate) return 'bg-[#FF8300]';
        if (neutro) return 'bg-white';
        return checked ? 'bg-[#5AD344]' : 'bg-white';
    };

    const getDotColor = () => {
        if (disabled) return '#d1d5db';
        if (checked && onColor) return onColor;
        if (!checked && offColor) return offColor;
        return undefined;
    };

    const renderButtonWithLabels = (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && onChange) onChange(!checked);
            }}
            className={`
                inline-flex h-6 shrink-0 items-center rounded-full gap-0
                transition-colors duration-200 ease-in-out bg-[#E9EDF7]
                ${checked ? 'flex-row-reverse pl-1.5 pr-1' : 'flex-row pl-1 pr-1.5'}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${className}
            `}
        >
            <span
                className="w-[18px] h-[18px] rounded-full shadow-[0px_3px_6px_#00000029] shrink-0 transition-colors duration-200 ease-in-out"
                style={{ backgroundColor: getDotColor() || undefined }}
            />
            <span className="text-[9px] font-garet font-bold text-[#465055] select-none px-1.5">
                {checked ? onLabel : offLabel}
            </span>
        </button>
    );

    if (hasLabels) {
        return tooltip ? <Tooltip content={tooltip}>{renderButtonWithLabels}</Tooltip> : renderButtonWithLabels;
    }

    const renderButton = (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && onChange) {
                    onChange(!checked);
                }
            }}
            className={`
                relative inline-flex h-5 w-7.5 shrink-0 items-center rounded-full
                transition-colors duration-200 ease-in-out ${neutro ? 'bg-[#C9CFD8]' : 'bg-[#E9EDF7]'}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${className}
            `}
        >
            <span
                className={`
                    inline-block w-3.5 h-3.5 transform rounded-full
                    shadow-[0px_3px_6px_#00000029]
                    transition-transform duration-200 ease-in-out
                    ${getTranslateClass()} ${getBackgroundColor()}
                `}
            />
        </button>
    );

    return tooltip ? <Tooltip content={tooltip}>{renderButton}</Tooltip> : renderButton;
};

export default Switch;
