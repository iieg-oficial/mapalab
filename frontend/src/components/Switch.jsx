const Switch = ({ checked, indeterminate, onChange, disabled, className = '' }) => {
    const getTranslateClass = () => {
        if (indeterminate) return 'translate-x-3';
        return checked ? 'translate-x-6' : 'translate-x-0';
    };

    const getBackgroundColor = () => {
        if (disabled) return 'bg-gray-300';
        if (indeterminate) return 'bg-yellow-400';
        return checked ? 'bg-blue-500' : 'bg-gray-400';
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
                relative inline-flex h-5 w-10 items-center rounded-full
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${getBackgroundColor()}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${className}
            `}
        >
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white
                    transition-transform duration-200 ease-in-out
                    ${getTranslateClass()}
                `}
            />
        </button>
    );
};

export default Switch;
