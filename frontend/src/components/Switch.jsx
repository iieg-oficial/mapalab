const Switch = ({ checked, indeterminate, onChange, disabled, className = '' }) => {
    const getTranslateClass = () => {
        if (indeterminate) return 'translate-x-2';
        return checked ? 'translate-x-3' : 'translate-x-1';
    };

    const getBackgroundColor = () => {
        if (disabled) return 'bg-gray-300';
        if (indeterminate) return 'bg-[#FF8300]';
        return checked ? 'bg-[#5AD344]' : 'bg-white';
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && onChange) {
                    onChange(!checked);
                }
            }}
            className={`
                relative inline-flex h-5 w-7.5 items-center rounded-full
                transition-colors duration-200 ease-in-out bg-[#E9EDF7]
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
};

export default Switch;
