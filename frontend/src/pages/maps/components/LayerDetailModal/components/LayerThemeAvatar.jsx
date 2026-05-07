import Icon from '@components/Icon';

const themeToIconMap = {
    'General': 'base_layers',
    'Demografía': 'demografia',
    'Salud': 'salud',
    'Economía': 'economia',
    'Educación': 'educacion',
    'Recursos y calidad de vida': 'recursos',
    'Desarrollo social': 'desarrollo',
    'Seguridad': 'seguridad',
    'Gobierno y ciudadanía': 'gobierno',
};

const normalize = (str) =>
    str?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

const normalizedMap = Object.fromEntries(
    Object.entries(themeToIconMap).map(([key, value]) => [normalize(key), value])
);

const resolveIcon = (name, icon) =>
    themeToIconMap[name] || normalizedMap[normalize(name)] || icon;

const LayerThemeAvatar = ({ icon, name, imageUrl, size = 'md' }) => {
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

    if (imageUrl) {
        return (
            <div className={`${sizeClasses[size]} flex items-center justify-center overflow-hidden rounded-md`} title={name}>
                <img src={imageUrl} alt={name || ''} loading="lazy" decoding="async" className="size-full object-cover" />
            </div>
        );
    }

    const iconName = resolveIcon(name, icon);

    return (
        <div className={`${sizeClasses[size]} flex items-center justify-center`} title={name}>
            <Icon name={iconName || 'General'} state="hover" className={iconSizeClasses[size]} />
        </div>
    );
};

export default LayerThemeAvatar;
