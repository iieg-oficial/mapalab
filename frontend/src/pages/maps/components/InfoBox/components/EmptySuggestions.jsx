import Icon from '@components/Icon';

const EmptySuggestions = ({ visible = true, queriedLayerName, alternativeLayers, onSelectLayer, onClose }) => {
    if (!visible) return null;

    const hasAlternatives = alternativeLayers && alternativeLayers.length > 0;

    return (
        <div className="bg-white rounded-[10px] shadow-[0px_6px_12px_#2F495C14] overflow-hidden">
            <div className="relative flex items-center justify-center bg-[#EFF3FC] px-4 py-3 w-[239px] h-[61px]">
                <p className="text-[12px]/[16px] font-bold font-garet text-[#2E4372] text-center pr-6">
                    {queriedLayerName || 'Información disponible'}
                </p>
                {onClose && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Icon name="close" size={14} />
                    </div>
                )}
            </div>

            <div className="p-4">
                {queriedLayerName && (
                    <p className="font-garet font-medium text-[11px]/[14px] text-[#465055] text-center mb-3">
                        No hay información en este punto
                    </p>
                )}

                {hasAlternatives ? (
                    <>
                        <p className="font-garet font-medium text-[10px]/[14px] text-[#465055] mb-2">
                            {queriedLayerName ? 'Capas con datos aquí:' : 'Capas con datos en este punto:'}
                        </p>
                        <div className="space-y-1.5">
                            {alternativeLayers.map((layer) => (
                                <button
                                    key={layer.id}
                                    onClick={() => onSelectLayer(layer)}
                                    className="group w-full flex items-center justify-between pl-5 pr-2 py-2 bg-[#F7F0FA] hover:bg-[#5C2471] rounded-[30px] cursor-pointer"
                                >
                                    <span className="font-garet font-medium text-[11px]/[14px] text-[#5C2472] group-hover:text-white truncate">
                                        {layer.name}
                                    </span>
                                    <span className="font-garet font-bold text-[10px]/[14px] text-[#FF8300] bg-white px-2 py-0.5 rounded-full shrink-0 ml-2">
                                        {layer.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="font-garet font-medium text-[10px]/[14px] text-[#8A9199] text-center italic">
                        No hay datos de ninguna capa activa en este punto
                    </p>
                )}
            </div>
        </div>
    );
};

export default EmptySuggestions;
