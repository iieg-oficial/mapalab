const Loading = ({
    visible = false,
    className = '',
    size = 'h-12 w-12',
    border = 'border-4',
    color = 'border-purple-500',
    fullContainer = false
}) => {
    if (!visible) return null;

    const spinner = (
        <div className={`animate-spin rounded-full border-t-transparent ${size} ${border} ${color} ${className}`} />
    );

    if (fullContainer) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
}

export default Loading;