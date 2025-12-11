import logoIiegLarge from '@assets/logos/iieg_large.svg';
import logoIiegShort from '@assets/logos/iieg_short.svg';
import logoMapalabLarge from '@assets/logos/mapalab_large.svg';
import logoMapalabShort from '@assets/logos/mapalab_short.svg';

const Logo = ({ name, className = '', size = 'w-12 h-12', expanded = false }) => {
    if (name === 'mapalab') {
        return (
            <img
                src={expanded ? logoMapalabLarge : logoMapalabShort}
                alt="Logo Mapalab"
                className={`${size} ${className}`}
            />
        );
    }

    if (name === 'iieg') {
        return (
            <img
                src={expanded ? logoIiegLarge : logoIiegShort}
                alt="Logo IIEG"
                className={`${size} ${className}`}
            />
        );
    }

    return null;
};

export default Logo;
