import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import Tooltip from '@components/Tooltip';
import logoIiegLarge from '@assets/logos/iieg_large.svg';
import logoIiegLargeDark from '@assets/logos/iieg_large_dark.svg';
import logoIiegShort from '@assets/logos/iieg_short.svg';
import logoMapalabLarge from '@assets/logos/mapalab_large.svg';
import logoMapalabLargeDark from '@assets/logos/mapalab_large_dark.svg';
import logoMapalabShort from '@assets/logos/mapalab_short.svg';
import logoMapalabSquare from '@assets/logos/mapalab_square.svg';

const LottieSpinner = lazy(() => import('./LottieSpinner'));

const colorFilters = {
    '#CBC5F1': 'brightness(0) saturate(100%) invert(83%) sepia(12%) saturate(746%) hue-rotate(206deg) brightness(101%) contrast(92%)',
    '#FFB98E': 'brightness(0) saturate(100%) invert(78%) sepia(31%) saturate(597%) hue-rotate(329deg) brightness(101%) contrast(101%)',
};

const Logo = ({
    name,
    alt = '',
    className = '',
    size = 'size-12',
    expanded = false,
    variant = 'light',
    isLoading = false,
    type = null,
    tooltip = null,
    tooltipPlacement = 'right',
    colorFilter = null,
    onClick = null,
    href = null,
    target = '_blank',
    visible = true
}) => {
    const lottieRef = useRef(null);
    const isLoadingRef = useRef(isLoading);
    const [lottieNeeded, setLottieNeeded] = useState(isLoading);

    useEffect(() => {
        isLoadingRef.current = isLoading;

        if (isLoading && !lottieNeeded) setLottieNeeded(true);

        if (!lottieRef.current) return;

        if (isLoading) {
            lottieRef.current.goToAndPlay(0);
        } else {
            lottieRef.current.stop();
        }
    }, [isLoading, lottieNeeded]);

    const handleDOMLoaded = () => {
        if (isLoadingRef.current && lottieRef.current) {
            lottieRef.current.goToAndPlay(0);
        }
    };

    const handleComplete = () => {
        if (isLoadingRef.current && lottieRef.current) {
            lottieRef.current.goToAndPlay(0);
        }
    };

    if (!visible) return null;

    const logos = {
        mapalab: {
            light: {
                large: logoMapalabLarge,
                short: logoMapalabShort,
                square: logoMapalabSquare,
            },
            dark: {
                large: logoMapalabLargeDark,
                short: logoMapalabShort,
                square: logoMapalabSquare,
            }
        },
        iieg: {
            light: {
                large: logoIiegLarge,
                short: logoIiegShort
            },
            dark: {
                large: logoIiegLargeDark,
                short: logoIiegShort
            }
        }
    };

    const currentLogo = logos[name]?.[variant] || logos[name]?.light;

    if (!currentLogo) return null;

    const filterStyle = colorFilter && colorFilters[colorFilter]
        ? { filter: colorFilters[colorFilter] }
        : {};



    const Wrapper = href ? 'a' : 'div';
    const wrapperProps = href
        ? { href, target, rel: 'noopener noreferrer', className: `flex items-center justify-center ${className} cursor-pointer` }
        : { onClick, className: `flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}` };

    const renderContent = () => {
        if (type && currentLogo[type]) {
            return (
                <Wrapper {...wrapperProps}>
                    <div className={`relative ${size}`}>
                        {lottieNeeded && (
                            <Suspense fallback={null}>
                                <LottieSpinner
                                    lottieRef={lottieRef}
                                    onDOMLoaded={handleDOMLoaded}
                                    onComplete={handleComplete}
                                    className={`
                                        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                        h-full aspect-square
                                        transition-opacity duration-300 ease-in-out
                                        ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                                    `}
                                />
                            </Suspense>
                        )}
                        <img
                            src={currentLogo[type]}
                            alt={alt || `Logo ${name} ${type}`}
                            style={filterStyle}
                            className={`
                                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                w-full h-full object-contain
                                transition-all duration-500 ease-in-out
                                ${isLoading ? 'opacity-0' : 'opacity-100'}
                            `}
                        />
                    </div>
                </Wrapper>
            );
        }

        return (
            <Wrapper {...wrapperProps}>
                <div className={`relative ${size}`}>
                    <Suspense fallback={null}>
                        <LottieSpinner
                            lottieRef={lottieRef}
                            onDOMLoaded={handleDOMLoaded}
                            onComplete={handleComplete}
                            className={`
                                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                h-full aspect-square
                                transition-opacity duration-300 ease-in-out
                                ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                            `}
                        />
                    </Suspense>
                    <img
                        src={currentLogo.short}
                        alt={alt || `Logo ${name} corto`}
                        style={filterStyle}
                        className={`
                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            w-full h-full object-contain
                            transition-all duration-500 ease-in-out
                            ${isLoading || expanded ? 'opacity-0' : 'opacity-100'}
                        `}
                    />
                    <img
                        src={currentLogo.large}
                        alt={alt || `Logo ${name} completo`}
                        style={filterStyle}
                        className={`
                            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            w-full h-full object-contain
                            transition-all duration-500 ease-in-out
                            ${isLoading || !expanded ? 'opacity-0' : 'opacity-100'}
                        `}
                    />
                </div>
            </Wrapper>
        );
    };

    if (tooltip) {
        return (
            <Tooltip content={tooltip} placement={tooltipPlacement} variant="normal">
                {renderContent()}
            </Tooltip>
        );
    }

    return renderContent();
};

export default Logo;
