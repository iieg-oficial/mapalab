import Icon from '@components/Icon';

const Checkbox = ({ checked, onChange, disabled, className = '' }) => {
    const getBackgroundColor = () => {
        if (disabled) return 'bg-[#E9EDF7]';
        return checked ? 'bg-[#703089]' : 'bg-[#EAEFFA]';
    };

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={!disabled ? onChange : undefined}
            className={`
                relative w-3.5 h-3.5 min-w-3.5 min-h-3.5 rounded-[4px] mr-2
                flex-shrink-0 flex items-center justify-center
                transition-all duration-200 ease-in-out
                ${getBackgroundColor()}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-[0px_3px_6px_#C1C1C143]'}
                ${className}
            `}
        >
            {checked && !disabled && (
                <Icon name="check" state="normal" className="w-2.9 h-1.1" />
            )}
        </button>
    );
};

export default Checkbox;
