import { useState } from 'react';
import Logo from '@components/Logo';

const LegendImage = ({ src, alt, scale = 1 }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [width, setWidth] = useState(null);
    if (!src || hasError) return null;
    return (
        <div className={`relative w-full ${isLoaded ? '' : 'min-h-[40px]'}`}>
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Logo name="mapalab" isLoading size="size-10" />
                </div>
            )}
            <img
                src={src}
                alt={`Leyenda de ${alt}`}
                className={`max-w-full h-auto transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${scale !== 1 && !isLoaded ? 'absolute' : ''}`}
                style={width ? { width } : undefined}
                onLoad={(e) => {
                    if (scale !== 1) setWidth(e.target.naturalWidth / scale);
                    setIsLoaded(true);
                }}
                onError={(e) => {
                    setHasError(true);
                    e.target.style.display = 'none';
                }}
            />
        </div>
    );
};

export default LegendImage;
