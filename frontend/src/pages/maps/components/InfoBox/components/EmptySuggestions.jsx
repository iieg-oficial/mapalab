import { useEffect } from 'react';
import InfoCard from './InfoCard';
import SymbolIcon from './SymbolIcon';
import { useLayerSymbolIcon } from '@hooksMaps/useLayerSymbolIcon';
import { useMapsContext } from '@hooks/useMaps';
import { trackInfoBoxAction } from '@services/analyticsService';

const AlternativeButton = ({ layer, isMobile, onSelect, onPulse, onPulseEnd }) => {
    const symbolUrl = useLayerSymbolIcon(layer.id);
    const textSize = isMobile ? 'text-[12px]/[16px]' : 'text-[11px]/[14px]';
    const badgeSize = isMobile ? 'text-[11px]/[14px]' : 'text-[10px]/[14px]';

    return (
        <button
            onClick={() => onSelect(layer)}
            onMouseEnter={isMobile ? undefined : () => onPulse(layer.id)}
            onMouseLeave={isMobile ? undefined : () => onPulseEnd()}
            className="group w-full flex items-center justify-between pl-4 pr-2 py-2 bg-[#F4EFF9] hover:bg-[#703089] rounded-[30px] cursor-pointer transition-all hover:shadow-[0_6px_6px_#5C247234]"
        >
            <span className="flex items-center gap-1.5 min-w-0">
                <SymbolIcon url={symbolUrl} className="size-4" />
                <span className={`font-garet font-medium ${textSize} text-purple group-hover:text-white truncate`}>
                    {layer.name}
                </span>
            </span>
            <span className={`font-garet font-bold ${badgeSize} text-orange bg-white px-2 py-0.5 rounded-full shrink-0 ml-2`}>
                {layer.count}
            </span>
        </button>
    );
};

const EmptySuggestions = ({ visible = true, queriedLayerName, queriedLayerId, alternativeLayers, onSelectLayer, onClose, variant = 'desktop' }) => {
    const { pulseLayer, cancelPulse } = useMapsContext();
    const symbolUrl = useLayerSymbolIcon(queriedLayerId, visible && !!queriedLayerName);

    useEffect(() => {
        if (!visible) return;
        trackInfoBoxAction('empty_suggestions_view', queriedLayerId || null);
    }, [visible, queriedLayerId]);

    useEffect(() => () => cancelPulse?.(), [cancelPulse]);

    if (!visible) return null;

    const hasAlternatives = alternativeLayers && alternativeLayers.length > 0;
    const isMobile = variant === 'mobile';
    const padX = isMobile ? 'px-5' : 'p-4';

    const handleSelect = (layer) => {
        cancelPulse?.();
        onSelectLayer(layer);
    };

    return (
        <InfoCard
            title={queriedLayerName || 'Información disponible'}
            variant={variant}
            onClose={onClose}
        >
            <div className={`${padX} pb-4`}>
                {queriedLayerName && (
                    <p className={`font-garet font-medium ${isMobile ? 'text-[12px]/[16px]' : 'text-[11px]/[14px]'} text-graphite text-center mb-3`}>
                        <SymbolIcon url={symbolUrl} className="inline-block size-5 align-middle mr-1.5" />
                        La capa seleccionada no tiene información en este punto.
                    </p>
                )}

                {hasAlternatives ? (
                    <>
                        <p className={`font-garet font-medium ${isMobile ? 'text-[12px]/[16px]' : 'text-[10px]/[14px]'} text-graphite mb-2`}>
                            {queriedLayerName ? 'Capas con datos aquí:' : 'Capas con datos en este punto:'}
                        </p>
                        <div className="space-y-1.5">
                            {alternativeLayers.map((layer) => (
                                <AlternativeButton
                                    key={layer.id}
                                    layer={layer}
                                    isMobile={isMobile}
                                    onSelect={handleSelect}
                                    onPulse={pulseLayer}
                                    onPulseEnd={cancelPulse}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <p className={`font-garet font-medium ${isMobile ? 'text-[12px]/[16px]' : 'text-[10px]/[14px]'} text-[#8A9199] text-center italic`}>
                        No hay datos de ninguna capa activa en este punto
                    </p>
                )}
            </div>
        </InfoCard>
    );
};

export default EmptySuggestions;
