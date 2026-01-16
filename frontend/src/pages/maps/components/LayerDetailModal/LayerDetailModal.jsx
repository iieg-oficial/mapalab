import { useContext, useState } from 'react';
import { useLayerMetadata } from '../../hooks/useLayerMetadata';
import { useSider } from '@contexts/SiderContext';
import MapsContext from '@contexts/MapsContext';
import DateTreeSelector from './components/DateTreeSelector';
import LayerDownloadModal from './components/LayerDownloadModal';
import OpacityControl from './components/OpacityControl';
import InfoCard from './components/InfoCard';
import StatCard from './components/StatCard';
import LayerThemeAvatar from './components/LayerThemeAvatar';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Loading from '@components/Loading';

const LayerDetailModal = () => {
    const { selectedLayer, setSelectedLayer, applyFilter, clearFilter, findLayerById, getLayerOpacity, setLayerOpacity } = useContext(MapsContext);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const { metadata, loading } = useLayerMetadata(selectedLayer?.id);
    const { isMobile } = useSider();

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
                <div className={`
                    h-full bg-white backdrop-blur-sm overflow-y-auto pointer-events-auto rounded-t-[20px] 
                    scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400
                `}>
                    <div className="sticky top-0 z-10 bg-white backdrop-blur-sm p-4 sm:px-6 sm:pt-6">
                        <div className="flex justify-between items-center">
                            <OpacityControl
                                value={getLayerOpacity(selectedLayer.id)}
                                onChange={(opacity) => setLayerOpacity(selectedLayer.id, opacity)}
                            />
                            <div className="flex items-center gap-5 md:gap-10">
                                <Tooltip content="Para ver todos los atributos te sugerimos descargar la capa completa." variant="warning">
                                    <button
                                        onClick={() => setShowDownloadModal(true)}
                                        className={`
                                            px-10 text-[14px]/[47px] text-white bg-[#703089] hover:bg-[#5C2472] rounded-[30px] 
                                            transition-colors hover:shadow-[0px_6px_6px_#5C247234] h-12.5 font-bold font-garet
                                        `}
                                    >
                                        {isMobile ? <Icon name="download" /> : 'Descargar capa'}
                                    </button>
                                </Tooltip>
                                <button
                                    onClick={() => setSelectedLayer(null)}
                                    aria-label="Cerrar"
                                >
                                    <div className="relative w-5 h-5">
                                        <Icon name="xl" className="absolute -left-2 inset-0 w-5 h-5" />
                                        <Icon name="xr" className="absolute inset-0 w-5 h-5" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                        {loading ? (
                            <div className="">
                                <Loading size="size-16" visible fullContainer />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center mb-4">
                                    <LayerThemeAvatar name={metadata?.theme?.name} size="md" />
                                    <span className="text-[14px]/[47px] font-garet font-bold text-[#465055] tracking-normal">
                                        {metadata?.theme?.name || 'General'}
                                    </span>
                                </div>

                                <div className="mb-2">
                                    <h3 className="text-[18px]/[47px] font-garet font-bold text-[#5C2472] tracking-normal">
                                        {selectedLayer.name || 'Capa sin nombre'}
                                    </h3>
                                </div>

                                {metadata?.updateInfo && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-3">
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
                                        <p className="text-[14px]/[32px] text-left font-garet font-medium text-[#465055] tracking-normal">
                                            {metadata.description}
                                        </p>
                                    </div>
                                )}

                                {metadata?.statistics && metadata.statistics.length > 0 && (
                                    <div className="mb-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {metadata.statistics.map((stat, index) => (
                                                <StatCard
                                                    key={index}
                                                    label={stat.label}
                                                    value={stat.value}
                                                />
                                            ))}
                                        </div>
                                        {metadata?.updateInfo?.lastUpdate && (
                                            <p className="text-[10px]/[11px] font-garet font-medium text-[#465055] tracking-normal mt-6">
                                                * La numeralia corresponde a datos del {formatDate(metadata.updateInfo.lastUpdate)}
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
                                        <div className="bg-[#F9FBFF] rounded-[11px] px-7 py-4">
                                            <span className="text-[14px]/[47px] font-garet font-bold text-[#5C2472] tracking-normal">
                                                Metodología
                                            </span>
                                            <p className="text-[12px]/[18px] text-left font-garet font-medium text-[#454545] tracking-normal">
                                                {metadata.methodology.content}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {metadata?.source && (
                                    <div className="bg-[#F9FBFF] rounded-[11px] px-7 py-4">
                                        <span className="text-[14px]/[47px] font-garet font-bold text-[#5C2472] tracking-normal">
                                            Fuente
                                        </span>
                                        <p className="text-[12px]/[18px] text-left font-garet font-medium text-[#454545] tracking-normal">
                                            {metadata.source}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
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
