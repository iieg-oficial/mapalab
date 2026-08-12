import Tooltip from '@components/Tooltip';

const Segmented = ({ options, value, onChange, disabled = false, className = '', ariaLabel }) => {
    const handleClick = (e, optionValue) => {
        e.stopPropagation();
        if (disabled || optionValue === value) return;
        onChange?.(optionValue);
    };

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={`
                inline-flex items-center gap-0.5 rounded-full bg-[#E9EDF7] p-0.5 shrink-0
                ${disabled ? 'opacity-50' : ''}
                ${className}
            `}
        >
            {options.map(option => {
                const isSelected = option.value === value;
                const button = (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={disabled}
                        onClick={(e) => handleClick(e, option.value)}
                        className={`
                            px-2.5 py-0.5 rounded-full text-[11px] font-garet font-bold
                            transition-colors duration-200 ease-in-out select-none
                            ${isSelected ? 'bg-white text-[#70308A] shadow-[0px_2px_4px_#00000014]' : 'text-[#465055] hover:text-[#70308A]'}
                            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {option.label}
                    </button>
                );

                return option.tooltip
                    ? <Tooltip key={option.value} content={option.tooltip}>{button}</Tooltip>
                    : button;
            })}
        </div>
    );
};

export default Segmented;
