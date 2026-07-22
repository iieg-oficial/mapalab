import { useMemo } from 'react';
import { renderCard } from '@pages/maps/components/InfoBox/utils/renderCard.jsx';

const PANEL_WIDTH = 239;
const MARGIN = 12;

const CatalogoInfoBox = ({ capa, features, pixel, onClose }) => {
    const cards = useMemo(() => {
        if (!features || features.length === 0) return [];
        const layerId = capa?.geoserverLayer || capa?.slug || null;
        return features
            .map((feature, idx) => renderCard(
                feature.properties,
                capa?.littleCard || null,
                null,
                layerId,
                feature.id,
                null,
                'desktop',
                idx + 1,
                features.length,
                null,
            ))
            .filter(Boolean);
    }, [features, capa]);

    if (cards.length === 0 || !pixel) return null;

    const left = Math.min(
        Math.max(pixel[0] + MARGIN, MARGIN),
        window.innerWidth - PANEL_WIDTH - MARGIN,
    );
    const top = Math.min(
        Math.max(pixel[1] - MARGIN, MARGIN),
        window.innerHeight - 220,
    );

    return (
        <div className="fixed z-30 w-[min(239px,88vw)]" style={{ left, top }}>
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar información"
                className="absolute -top-2 -right-2 z-10 size-6 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] flex items-center justify-center text-[#6E7477] hover:text-purple hover:bg-purple-soft transition-colors"
            >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>

            {cards.length === 1 ? (
                cards[0]
            ) : (
                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin space-y-2">
                    {cards.map((card, idx) => (
                        <div key={features[idx].id ?? idx}>{card}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CatalogoInfoBox;
