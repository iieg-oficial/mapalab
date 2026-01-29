import Icon from '@components/Icon';

const themeToIconMap = {
    'Demografía': 'demografia',
    'Salud': 'salud',
    'Economía': 'economia',
    'Educación': 'educacion',
    'Recursos y calidad de vida': 'recursos',
    'Desarrollo social': 'desarrollo',
    'Seguridad': 'seguridad',
    'Gobierno y ciudadanía': 'gobierno',
};

const LayerThemeAvatar = ({ icon, name, size = 'md' }) => {
    const sizeClasses = {
        sm: 'size-10',
        md: 'size-16',
        lg: 'size-20'
    };

    const iconSizeClasses = {
        sm: 'size-6',
        md: 'size-10',
        lg: 'size-12'
    };

    const iconName = themeToIconMap[name] || icon;

    return (
        <div className={`${sizeClasses[size]} flex items-center justify-center`} title={name}>
            <Icon name={iconName || "general"} state="hover" className={iconSizeClasses[size]} />
        </div>
    );
};

export default LayerThemeAvatar;
