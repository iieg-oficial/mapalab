const Loading = ({
    visible = false,
    className = '',
    size = 'h-12 w-12',
    border = 'border-4',
    color = 'border-purple-500'
}) => {
    if (!visible) return null;

    return (
        <div className={`animate-spin rounded-full border-t-transparent ${size} ${border} ${color} ${className}`} />
    );
}

export default Loading;