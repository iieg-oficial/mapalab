import { useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import logoIiegLarge from '@assets/logos/iieg_large.svg';
import logoIiegShort from '@assets/logos/iieg_short.svg';
import logoMapalabLarge from '@assets/logos/mapalab_large.svg';
import logoMapalabLargeDark from '@assets/logos/mapalab_large_dark.svg';
import logoMapalabShort from '@assets/logos/mapalab_short.svg';
import spinnerAnimation from '@assets/Loading/spinner.json';

const Logo = ({ name, className = '', size = 'w-12 h-12', expanded = false, variant = 'light', isLoading = false }) => {
    const lottieRef = useRef(null);
    const isLoadingRef = useRef(isLoading);

    useEffect(() => {
        isLoadingRef.current = isLoading;

        if (!lottieRef.current) return;

        if (isLoading) {
            lottieRef.current.goToAndPlay(0);
        } else {
            lottieRef.current.stop();
        }
    }, [isLoading]);

    const handleComplete = () => {
        if (isLoadingRef.current && lottieRef.current) {
            lottieRef.current.goToAndPlay(0);
        }
    };

    const logos = {
        mapalab: {
            light: {
                large: logoMapalabLarge,
                short: logoMapalabShort,
            },
            dark: {
                large: logoMapalabLargeDark,
                short: logoMapalabShort,
            }
        },
        iieg: {
            light: {
                large: logoIiegLarge,
                short: logoIiegShort
            },
            dark: {
                large: logoIiegLarge,
                short: logoIiegShort
            }
        }
    };

    const currentLogo = logos[name]?.[variant] || logos[name]?.light;

    if (!currentLogo) return null;

    return (
        <div className={`relative flex items-center justify-center ${size} ${className}`}>
            <Lottie
                lottieRef={lottieRef}
                animationData={spinnerAnimation}
                loop={false}
                autoplay={false}
                onComplete={handleComplete}
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    h-full aspect-square
                    transition-opacity duration-300 ease-in-out
                    ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
            />
            <img
                src={currentLogo.short}
                alt={`Logo ${name} corto`}
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    max-w-full max-h-full object-contain
                    transition-all duration-500 ease-in-out
                    ${isLoading || expanded ? 'opacity-0' : 'opacity-100'}
                `}
            />
            <img
                src={currentLogo.large}
                alt={`Logo ${name} completo`}
                className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    max-w-full max-h-full object-contain
                    transition-all duration-500 ease-in-out
                    ${isLoading || !expanded ? 'opacity-0' : 'opacity-100'}
                `}
            />
        </div>
    );
};

export default Logo;
