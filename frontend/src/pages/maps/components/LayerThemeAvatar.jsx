const LayerThemeAvatar = ({ icon, color, name, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-10 h-10 text-xl',
        md: 'w-16 h-16 text-3xl',
        lg: 'w-20 h-20 text-4xl'
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg`}
            style={{ backgroundColor: color || '#64748b' }}
            title={name}
        >
            <span className="filter drop-shadow-sm" role="img" aria-label={name}>
                {icon || '📊'}
            </span>
        </div>
    );
};

export default LayerThemeAvatar;
