import logoIiegLarge from '@assets/logos/iieg_large.svg';
import logoIiegShort from '@assets/logos/iieg_short.svg';
import logoMapalabLarge from '@assets/logos/mapalab_large.svg';
import logoMapalabShort from '@assets/logos/mapalab_short.svg';

const Logo = ({ name, className = '', size = 'w-12 h-12', expanded = false }) => {
    const logos = {
        mapalab: {
            large: logoMapalabLarge,
            short: logoMapalabShort,
        },
        iieg: {
            large: logoIiegLarge,
            short: logoIiegShort
        }
    };

    const currentLogo = logos[name];

    if (!currentLogo) return null;

    return (
        <div className={`relative flex items-center justify-center ${size} ${className}`}>
            <img
                src={currentLogo.short}
                alt={`Logo ${name} corto`}
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    max-w-full max-h-full object-contain
                    transition-all duration-500 ease-in-out
                    ${expanded ? 'opacity-0' : 'opacity-100'}
                `}
            />
            <img
                src={currentLogo.large}
                alt={`Logo ${name} completo`}
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    max-w-full max-h-full object-contain
                    transition-all duration-500 ease-in-out
                    ${expanded ? 'opacity-100' : 'opacity-0'}
                `}
            />
        </div>
    );
};

export default Logo;
