import { useState } from 'react';
import Loading from '@components/Loading';
import Alert from '@components/Alert';
import ScrollContainer from '@components/ScrollContainer';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import InfoCard from './InfoCard';
import SymbolIcon from './SymbolIcon';
import { useLayerSymbolIcon } from '@hooksMaps/useLayerSymbolIcon';

const LayerRow = ({ layerId, name, count, bodySize, badgeSize }) => {
    const symbolUrl = useLayerSymbolIcon(layerId);

    return (
        <div className="bg-[#EFF3FC] rounded-[5px] py-2 px-3 flex justify-between items-center">
            <span className="flex items-center gap-1.5 min-w-0">
                <SymbolIcon url={symbolUrl} className="size-4" />
                <span className={`font-garet font-medium ${bodySize} text-[#465055] truncate`}>{name}</span>
            </span>
            <span className={`font-garet font-bold ${badgeSize} text-[#FF8300] bg-white px-2 py-0.5 rounded-full shrink-0 ml-2`}>
                {formatNumber(count)}
            </span>
        </div>
    );
};

const SummaryCard = ({ visible = false, results = [], matched = 0, enBorde = 0, isExpanded, isLoadingExpand, onToggleExpand, variant = 'desktop' }) => {
    const [showWarning, setShowWarning] = useState(false);

    if (!visible) return null;

    const isMobile = variant === 'mobile';
    const padX = isMobile ? 'px-5' : 'px-4';
    const bodySize = isMobile ? 'text-[12px]/[16px]' : 'text-[10px]/[14px]';
    const badgeSize = isMobile ? 'text-[11px]/[14px]' : 'text-[10px]/[14px]';

    const totalFeatures = results.reduce((total, result) => total + result.features.length, 0);
    const totalEnArea = matched > totalFeatures ? matched : totalFeatures;
    const hasMany = totalFeatures > 5000;

    const layerBreakdown = results
        .filter(result => result.features?.length > 0)
        .map(result => ({
            layerId: result.layerId,
            name: result.layerName,
            count: result.features.length
        }));

    const handleToggle = () => {
        if (!isExpanded && hasMany && !showWarning) {
            setShowWarning(true);
            return;
        }
        setShowWarning(false);
        onToggleExpand();
    };

    const handleCancelWarning = () => {
        setShowWarning(false);
    };

    return (
        <InfoCard
            title={isExpanded ? null : 'Resumen de selección'}
            variant={variant}
            maxHeightClass={isExpanded ? '' : 'max-h-[60vh]'}
            className="mb-2"
        >
            {!isExpanded && (
                <>
                    <div className={`${padX} pt-3 pb-2 shrink-0`}>
                        <div className={`font-garet font-medium ${bodySize} text-[#465055]`}>
                            <span className="font-bold">Total de elementos:</span> {formatNumber(totalEnArea)}
                        </div>
                        {enBorde > 0 && (
                            <div className={`font-garet ${bodySize} text-[#7e8a91] mt-0.5`}>
                                Cruzan el borde, sin contar: {formatNumber(enBorde)}
                            </div>
                        )}
                        {totalEnArea > totalFeatures && (
                            <div className={`font-garet ${bodySize} text-[#7e8a91] mt-0.5`}>
                                Se muestran los primeros {formatNumber(totalFeatures)}
                            </div>
                        )}
                    </div>

                    <ScrollContainer
                        className={`${padX} flex-1`}
                        overlayFade
                        overlayColor="#FFFFFF"
                        clickableArrows
                        minItemsForClick={4}
                        itemCount={layerBreakdown.length}
                    >
                        <div className="space-y-1 mb-3">
                            {layerBreakdown.map((layer, idx) => (
                                <LayerRow
                                    key={layer.layerId || idx}
                                    layerId={layer.layerId}
                                    name={layer.name}
                                    count={layer.count}
                                    bodySize={bodySize}
                                    badgeSize={badgeSize}
                                />
                            ))}
                        </div>
                    </ScrollContainer>
                </>
            )}

            {totalFeatures > 0 && <div className={`${padX} ${isExpanded ? 'py-3' : 'pt-0 pb-4'} shrink-0`}>
                {showWarning && (
                    <div className="mb-3">
                        <Alert
                            severity="warning"
                            title="Gran cantidad de elementos"
                            message={`Has seleccionado ${formatNumber(totalFeatures)} elementos. Mostrar todos los detalles puede tardar un momento y hacer más lento tu navegador. ¿Deseas continuar?`}
                            onClose={handleToggle}
                            closeButtonLabel="Sí, mostrar detalles"
                        />
                        <button
                            onClick={handleCancelWarning}
                            className={`mt-2 w-full font-garet font-medium ${bodySize} text-[#465055] hover:text-[#5C2472]`}
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                <button
                    onClick={handleToggle}
                    disabled={isLoadingExpand || showWarning}
                    className={`w-full bg-[#703089] text-white font-garet font-bold ${bodySize} py-2 px-4 rounded-[30px] transition-all flex items-center justify-center gap-2 ${(isLoadingExpand || showWarning) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234]'}`}
                >
                    {isLoadingExpand ? (
                        <>
                            <Loading visible size="size-4" border="border-2" color="border-white" />
                            Cargando detalles...
                        </>
                    ) : isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
            </div>}
        </InfoCard>
    );
};

export default SummaryCard;
