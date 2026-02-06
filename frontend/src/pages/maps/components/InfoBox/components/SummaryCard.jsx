import { useState } from 'react';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import Alert from '@components/Alert';

const SummaryCard = ({ visible = false, results = [], isExpanded, isLoadingExpand, onToggleExpand, onClose }) => {
    const [showWarning, setShowWarning] = useState(false);

    if (!visible) return null;

    const totalFeatures = results.reduce((total, result) => total + result.features.length, 0);
    const hasMany = totalFeatures > 5000;

    const layerBreakdown = results
        .filter(result => result.features?.length > 0)
        .map(result => ({
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
        <div className="bg-white rounded-[10px] shadow-[0px_6px_12px_#2F495C14] mb-2 relative flex flex-col max-h-[60vh]">
            {onClose && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <Icon name="close" size={14} />
                </div>
            )}

            <div className="p-4 pb-3 pr-6 shrink-0">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Resumen de selección</h3>
                <div className="text-xs text-gray-600">
                    <span className="font-medium">Total de elementos:</span> {totalFeatures}
                </div>
            </div>

            <div className="px-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <div className="space-y-1 mb-3">
                    {layerBreakdown.map((layer, idx) => (
                        <div
                            key={idx}
                            className="bg-[#EFF3FC] rounded-[5px] py-2 px-3 flex justify-between items-center"
                        >
                            <span className="text-xs font-medium text-gray-700">{layer.name}</span>
                            <span className="text-xs font-bold text-gray-900 bg-white rounded-full px-2 py-0.5">
                                {layer.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 pt-0 shrink-0">
                {showWarning && (
                    <div className="mb-3">
                        <Alert
                            severity="warning"
                            title="Gran cantidad de elementos"
                            message={`Has seleccionado ${totalFeatures.toLocaleString()} elementos. Mostrar todos los detalles puede tardar un momento y hacer más lento tu navegador. ¿Deseas continuar?`}
                            onClose={handleToggle}
                            closeButtonLabel="Sí, mostrar detalles"
                        />
                        <button
                            onClick={handleCancelWarning}
                            className="mt-2 w-full text-xs text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                <button
                    onClick={handleToggle}
                    disabled={isLoadingExpand || showWarning}
                    className={`w-full bg-[#2F495C] text-white text-xs font-medium py-2 px-4 rounded-[5px] transition-colors flex items-center justify-center gap-2 ${(isLoadingExpand || showWarning) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#1e2f3c]'
                        }`}
                >
                    {isLoadingExpand ? (
                        <>
                            <Loading visible={true} className="h-4 w-4" />
                            Cargando detalles...
                        </>
                    ) : isExpanded ? "Ocultar detalles" : "Ver detalles"}
                </button>
            </div>
        </div>
    );
};

export default SummaryCard;
