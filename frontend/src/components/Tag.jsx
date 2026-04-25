const STATE_STYLES = {
    beta: 'bg-amber-100 text-amber-800 border-amber-300',
    dev: 'bg-slate-200 text-slate-700 border-slate-400',
    nueva: 'bg-green-100 text-green-800 border-green-300',
    test: 'bg-red-100 text-red-800 border-red-300',
};

const STATE_LABELS = {
    beta: 'BETA',
    dev: 'DEV',
    nueva: 'NUEVA',
    test: 'TEST',
};

const SIZE_CLASSES = {
    xs: 'text-[8px] px-1 py-0',
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
};

const Tag = ({ state, label, size = 'sm', className = '' }) => {
    const stateStyle = STATE_STYLES[state] || STATE_STYLES.dev;
    const text = label || STATE_LABELS[state] || (state ? state.toUpperCase() : '');
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

    return (
        <span
            className={`inline-flex items-center font-bold uppercase tracking-wider rounded border ${stateStyle} ${sizeClass} ${className}`}
        >
            {text}
        </span>
    );
};

export default Tag;
