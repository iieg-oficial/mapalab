import InfoCard from './InfoCard';

const EmptySuggestions = ({ visible = true, queriedLayerName, alternativeLayers, onSelectLayer, onClose, variant = 'desktop' }) => {
    if (!visible) return null;

    const hasAlternatives = alternativeLayers && alternativeLayers.length > 0;
    const isMobile = variant === 'mobile';
    const padX = isMobile ? 'px-5' : 'p-4';

    return (
        <InfoCard
            title={queriedLayerName || 'Información disponible'}
            variant={variant}
            onClose={onClose}
        >
            <div className={`${padX} pb-4`}>
                {queriedLayerName && (
                    <p className={`font-garet font-medium ${isMobile ? 'text-[12px]/[16px]' : 'text-[11px]/[14px]'} text-[#465055] text-center mb-3`}>
                        No hay información en este punto
                    </p>
                )}

                {hasAlternatives ? (
                    <>
                        <p className={`font-garet font-medium ${isMobile ? 'text-[12px]/[16px]' : 'text-[10px]/[14px]'} text-[#465055] mb-2`}>
                            {queriedLayerName ? 'Capas con datos aquí:' : 'Capas con datos en este punto:'}
                        </p>
                        <div className="space-y-1.5">
                            {alternativeLayers.map((layer) => (
                                <button
                                    key={layer.id}
                                    onClick={() => onSelectLayer(layer)}
                                    className="group w-full flex items-center justify-between pl-4 pr-2 py-2 bg-[#F4EFF9] hover:bg-[#703089] rounded-[30px] cursor-pointer transition-all hover:shadow-[0_6px_6px_#5C247234]"
                                >
                                    <span className={`font-garet font-medium ${isMobile ? 'text-[12px]/[16px]' : 'text-[11px]/[14px]'} text-[#5C2472] group-hover:text-white truncate`}>
                                        {layer.name}
                                    </span>
                                    <span className={`font-garet font-bold ${isMobile ? 'text-[11px]/[14px]' : 'text-[10px]/[14px]'} text-[#FF8300] bg-white px-2 py-0.5 rounded-full shrink-0 ml-2`}>
                                        {layer.count}
                                    </span>
                                </button>
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
