import { useContext, useState } from 'react';
import MapsContext from '@contexts/MapsContext';
import DateTreeSelector from './DateTreeSelector';
import LayerDownloadModal from './LayerDownloadModal';
import OpacityControl from './OpacityControl';
import InfoCard from './InfoCard';
import StatCard from './StatCard';
import LayerThemeAvatar from './LayerThemeAvatar';
import { useLayerMetadata } from '../hooks/useLayerMetadata';

const LayerDetailModal = () => {
    const { selectedLayer, setSelectedLayer, applyFilter, clearFilter, findLayerById, getLayerOpacity, setLayerOpacity } = useContext(MapsContext);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const { metadata, loading } = useLayerMetadata(selectedLayer?.id);

    const layerData = findLayerById ? findLayerById(selectedLayer?.id) : null;
    const isProperty = layerData && (!layerData.children || layerData.children.length === 0);
    const hasPeriodicity = layerData?.hasPeriodicity !== false;

    const handleDateFilterApply = (filterData) => {
        if (selectedLayer && selectedLayer.id) {
            applyFilter(selectedLayer.id, filterData.filterName, filterData.cqlFilter);
        }
    };

    const handleClearFilter = () => {
        if (selectedLayer && selectedLayer.id) {
            clearFilter(selectedLayer.id, 'date');
        }
    };

    if (!selectedLayer || isProperty) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <>
            <div className="fixed top-[52px] sm:top-[104px] bottom-0 right-0 sm:right-4 z-30 w-full sm:w-[643px] pointer-events-none">
                <div className="h-full bg-white/95 backdrop-blur-sm shadow-2xl overflow-y-auto pointer-events-auto rounded-t-[20px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                    <div>
                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm p-4 sm:px-6 sm:pt-6">
                            <div className="flex justify-between items-center">
                                <OpacityControl
                                    value={getLayerOpacity(selectedLayer.id)}
                                    onChange={(opacity) => setLayerOpacity(selectedLayer.id, opacity)}
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowDownloadModal(true)}
                                        className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-sm"
                                        title="Para ver todos los atributos te sugerimos descargar la capa completa."
                                    >
                                        Descargar capa
                                    </button>
                                    <button
                                        onClick={() => setSelectedLayer(null)}
                                        className="text-2xl hover:bg-gray-200 rounded-lg px-3 py-1 transition-colors"
                                        aria-label="Cerrar"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 pb-4 sm:px-6 sm:pb-6">

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <>
                                    {metadata?.theme && (
                                        <div className="flex items-center gap-3 mb-4">
                                            <LayerThemeAvatar
                                                icon={metadata.theme.icon}
                                                color={metadata.theme.color}
                                                name={metadata.theme.name}
                                                size="sm"
                                            />
                                            <span className="text-sm font-medium text-gray-600">
                                                {metadata.theme.name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                                            {selectedLayer.name}
                                        </h3>
                                    </div>

                                    {metadata?.updateInfo && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                            <InfoCard
                                                label="Frecuencia de actualización"
                                                value={metadata.updateInfo.frequency}
                                            />
                                            <InfoCard
                                                label="Última actualización"
                                                value={formatDate(metadata.updateInfo.lastUpdate)}
                                            />
                                        </div>
                                    )}

                                    {metadata?.description && (
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {metadata.description}
                                            </p>
                                        </div>
                                    )}

                                    {metadata?.statistics && metadata.statistics.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Estadísticas</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                                {metadata.statistics.map((stat, index) => (
                                                    <StatCard
                                                        key={index}
                                                        label={stat.label}
                                                        value={stat.value}
                                                        unit={stat.unit}
                                                    />
                                                ))}
                                            </div>
                                            {metadata?.updateInfo?.lastUpdate && (
                                                <p className="text-[10px] text-gray-500 mt-2">
                                                    * Datos actualizados a {formatDate(metadata.updateInfo.lastUpdate)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {hasPeriodicity && (
                                        <div className="mb-4">
                                            <DateTreeSelector
                                                layerId={selectedLayer.id}
                                                onFilterApply={handleDateFilterApply}
                                                onClearFilter={handleClearFilter}
                                                filterName="date"
                                            />
                                        </div>
                                    )}

                                    {metadata?.methodology && (
                                        <div className="mb-4">
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                                    {metadata.methodology.title || 'Metodología'}
                                                </h4>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {metadata.methodology.content}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {(metadata?.source || metadata?.license) && (
                                        <div className="border-t pt-4 mt-4">
                                            <div className="space-y-2 text-xs text-gray-600">
                                                {metadata.source && (
                                                    <p>
                                                        <span className="font-semibold">Fuente:</span> {metadata.source}
                                                    </p>
                                                )}
                                                {metadata.license && (
                                                    <p>
                                                        <span className="font-semibold">Licencia:</span> {metadata.license}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDownloadModal && (
                <LayerDownloadModal
                    layerId={selectedLayer.id}
                    layerName={selectedLayer.name}
                    onClose={() => setShowDownloadModal(false)}
                />
            )}
        </>
    );
};

export default LayerDetailModal;