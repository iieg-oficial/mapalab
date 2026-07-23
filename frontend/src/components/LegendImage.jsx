import { useState } from 'react';
import Logo from '@components/Logo';

const LegendImage = ({ src, alt }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
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
                className={`max-w-full h-auto transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                onError={(e) => {
                    setHasError(true);
                    e.target.style.display = 'none';
                }}
            />
        </div>
    );
};

export default LegendImage;
