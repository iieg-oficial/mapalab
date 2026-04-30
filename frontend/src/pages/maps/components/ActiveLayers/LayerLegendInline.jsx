import { useState } from 'react';
import { useWMSLegend } from '@hooksMaps/useWMSLegend';
import { useLegendsVisibility } from './hooks/useLegendsVisibility';

const LegendImage = ({ src, alt }) => {
    const [hasError, setHasError] = useState(false);
    if (!src || hasError) return null;
    return (
        <img
            src={src}
            alt={`Leyenda de ${alt}`}
            className="max-w-full h-auto"
            onError={(e) => {
                setHasError(true);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
            }}
        />
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
