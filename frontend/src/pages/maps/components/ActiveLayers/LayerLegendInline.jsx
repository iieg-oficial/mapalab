import { useState } from 'react';
import { useWMSLegend } from '@hooksMaps/useWMSLegend';
import { useLegendsVisibility } from './hooks/useLegendsVisibility';
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

const LayerLegendInline = ({ layer, compareMode, slotMembership }) => {
    const { hasLegend, getLegendUrl } = useWMSLegend();
    const { visible } = useLegendsVisibility();
    if (!visible) return null;
    if (!layer || !hasLegend(layer)) return null;

    const isSwipe = !!compareMode?.active;

    let url;
    if (!isSwipe || !slotMembership) {
        url = getLegendUrl(layer);
    } else {
        const activeSlot = slotMembership === 'AB'
            ? (compareMode.activeSlot === 'B' ? 'B' : 'A')
            : slotMembership;
        const slotDate = compareMode[activeSlot === 'A' ? 'paneA' : 'paneB']?.filters?.[layer.id]?.date;
        url = getLegendUrl(layer, { dateValue: slotDate });
    }

    if (!url) return null;

    return (
        <div className="w-full bg-white rounded-[13px] overflow-hidden p-2">
            <LegendImage src={url} alt={`Leyenda de ${layer.name}`} />
        </div>
    );
};

export default LayerLegendInline;
