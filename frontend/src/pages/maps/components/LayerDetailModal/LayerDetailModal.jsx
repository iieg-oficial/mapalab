import { useContext, useState, useRef, useCallback } from 'react';
import { useLayerMetadata } from '../../hooks/useLayerMetadata';
import { useSider } from '@contexts/SiderContext';
import MapsContext from '@contexts/MapsContext';
import DateTreeSelector from './components/DateTreeSelector';
import SimpleDateSelector from './components/SimpleDateSelector';
import LayerDownloadModal from './components/LayerDownloadModal';
import OpacityControl from './components/OpacityControl';
import InfoCard from './components/InfoCard';
import StatCard from './components/StatCard';
import LayerThemeAvatar from './components/LayerThemeAvatar';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Logo from '@components/Logo';

const LayerDetailModal = () => {
    const { selectedLayer, setSelectedLayer, applyFilter, clearFilter, getLayerOpacity, setLayerOpacity } = useContext(MapsContext);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const { metadata, loading } = useLayerMetadata(selectedLayer?.id);
    const { isMobile } = useSider();
    const longPressTimer = useRef(null);

    const hasPeriodicity = metadata?.periodicity != null;

    const handleLongPressStart = useCallback(() => {
        longPressTimer.current = setTimeout(() => {
            setIsAdvancedMode(prev => !prev);
            longPressTimer.current = null;
        }, 1000);
    }, []);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

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

    if (!selectedLayer) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <>
            <div className="fixed top-[52px] sm:top-[104px] bottom-0 right-0 sm:right-4 z-30 w-full sm:w-[643px] pointer-events-none">
                <div className={`
                    h-full bg-white shadow-[0_5px_20px_#1A26641A] backdrop-blur-sm overflow-y-auto pointer-events-auto rounded-t-[20px]
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
                                <Icon 
                                    name="cerrarModal" 
                                    aria-label="Cerrar" 
                                    onClick={() => setSelectedLayer(null)} 
                                    classNameBG="rounded-full hover:shadow-[0px_5px_20px_#101F3629]"
                                    className="size-10 " 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                        {loading ? (<Logo name="mapalab" size="size-36" className="mt-40 lg:mt-52" isLoading />) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <LayerThemeAvatar name={metadata?.tema} size="md" />
                                    <span className="text-[14px]/[47px] font-garet font-bold text-[#465055] tracking-normal">
                                        {metadata?.tema || 'General'}
                                    </span>
                                </div>
                                <h3 className="text-[18px]/[47px] font-garet font-extrabold text-[#5C2472] tracking-normal">
                                    {selectedLayer.name || 'Capa sin nombre'}
                                </h3>

                                {(metadata?.frecuencia_actualizacion || metadata?.fecha_ultima_actualizacion) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-3">
                                        <InfoCard
                                            label="Frecuencia de actualización"
                                            value={metadata.frecuencia_actualizacion}
                                        />
                                        <InfoCard
                                            label="Última actualización"
                                            value={formatDate(metadata.fecha_ultima_actualizacion)}
                                        />
                                    </div>
                                )}

                                {metadata?.descripcion && (
                                    <div className="mb-4">
                                        <p className="text-[14px]/[32px] text-left font-garet font-medium text-[#465055] tracking-normal">
                                            {metadata.descripcion}
                                        </p>
                                    </div>
                                )}

                                {metadata?.numeralia && metadata.numeralia.length > 0 && (
                                    <div className="mb-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {metadata.numeralia.map((stat, index) => (
                                                <StatCard
                                                    key={index}
                                                    label={stat.nombre}
                                                    value={stat.valor}
                                                />
                                            ))}
                                        </div>
                                        {metadata?.nombre_pie_numeralia?.[0] && (
                                            <p className="text-[10px]/[11px] font-garet font-medium text-[#465055] tracking-normal mt-6">
                                                * {metadata.nombre_pie_numeralia[0]}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {hasPeriodicity && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between my-5">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-[14px]/[16px] font-garet font-bold text-[#5C2472] tracking-normal select-none cursor-pointer"
                                                    onDoubleClick={() => setIsAdvancedMode(prev => !prev)}
                                                    onMouseDown={handleLongPressStart}
                                                    onMouseUp={handleLongPressEnd}
                                                    onMouseLeave={handleLongPressEnd}
                                                >
                                                    Periodicidad:
                                                </span>
                                                {isAdvancedMode && (
                                                    <Icon
                                                        name="info_warning"
                                                        className="size-4 cursor-help"
                                                        tooltip="Click simple: navegar opciones. Doble click: seleccionar fecha. Click en seleccionado: deseleccionar."
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        {isAdvancedMode ? (
                                            <DateTreeSelector
                                                layerId={selectedLayer.id}
                                                periodicity={metadata.periodicity}
                                                onFilterApply={handleDateFilterApply}
                                                onClearFilter={handleClearFilter}
                                                filterName="date"
                                            />
                                        ) : (
                                            <SimpleDateSelector
                                                layerId={selectedLayer.id}
                                                periodicity={metadata.periodicity}
                                                onFilterApply={handleDateFilterApply}
                                                onClearFilter={handleClearFilter}
                                                filterName="date"
                                            />
                                        )}
                                    </div>
                                )}

                                {metadata?.metodologia_texto && (
                                    <div className="mb-4">
                                        <div className="bg-[#F9FBFF] rounded-[11px] px-7 py-4">
                                            <span className="text-[14px]/[47px] font-garet font-bold text-[#5C2472] tracking-normal">
                                                Metodología
                                            </span>
                                            <p className="text-[12px]/[18px] text-left font-garet font-medium text-[#454545] tracking-normal">
                                                {metadata.metodologia_texto}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {metadata?.fuentes_texto && (
                                    <div className="bg-[#F9FBFF] rounded-[11px] px-7 py-4">
                                        <span className="text-[14px]/[47px] font-garet font-bold text-[#5C2472] tracking-normal">
                                            Fuente
                                        </span>
                                        <p className="text-[12px]/[18px] text-left font-garet font-medium text-[#454545] tracking-normal">
                                            {metadata.fuentes_texto}
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
