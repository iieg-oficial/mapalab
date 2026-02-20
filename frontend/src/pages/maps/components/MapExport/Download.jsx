import { useState, useRef, useEffect } from 'react';
import { useMapDownload } from './hooks/useMapDownload';
import { QUALITY_PRESETS } from './utils/exportDimensions';
import { useSider } from '@contexts/SiderContext';
import SymbologyItem from '../SymbologyItem';
import Icon from '@components/Icon';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';
import ScrollContainer from '@components/ScrollContainer';
import QualitySelector from './QualitySelector';

const Download = ({ onOpenPreview }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedLegendLayers, setSelectedLegendLayers] = useState([]);
    const [title, setTitle] = useState('Capas mapalab');
    const { isMobile } = useSider();
    const anchorRef = useRef(null);
    const [format, setFormat] = useState('png');
    const [viewType, setViewType] = useState('viewport');
    const [qualityIndex, setQualityIndex] = useState(1);

    const {
        downloadMap, isDownloading, canDownload,
        layersWithLegends, selectedLayer
    } = useMapDownload();

    useEffect(() => {
        const layer = selectedLayer || layersWithLegends[0];
        setTitle(layer?.label || layer?.name || 'Capas mapalab');
    }, [selectedLayer, layersWithLegends]);

    useEffect(() => {
        if (layersWithLegends.length === 0) {
            setSelectedLegendLayers([]);
            return;
        }

        if (format === 'pdf') {
            setSelectedLegendLayers(layersWithLegends);
            return;
        }

        const targetLayer = selectedLayer
            ? layersWithLegends.find(l => l.id === selectedLayer.id)
            : null;

        if (targetLayer) {
            setSelectedLegendLayers([targetLayer]);
        } else if (selectedLegendLayers.length !== 1 || !layersWithLegends.find(l => l.id === selectedLegendLayers[0]?.id)) {
            setSelectedLegendLayers([layersWithLegends[0]]);
        }
    }, [format, layersWithLegends, selectedLayer, isPanelOpen]);

    const handleDownloadClick = () => {
        if (!canDownload || isDownloading) return;
        setIsPanelOpen(true);
    };

    const executeDownload = async () => {
        const quality = QUALITY_PRESETS[qualityIndex];
        if (viewType === 'viewport' && format !== 'pdf') {
            if (onOpenPreview) {
                onOpenPreview(format, selectedLegendLayers, title, quality);
            }
        } else {
            await downloadMap(format, selectedLegendLayers, viewType, title, null, quality);
        }
    };

    const handleConfirmDownload = () => {
        setIsPanelOpen(false);
        executeDownload();
    };

    const handleLayerSelect = (layer) => {
        if (format === 'pdf') {
            setSelectedLegendLayers(prev => {
                const exists = prev.find(l => l.id === layer.id);
                if (exists) {
                    return prev.filter(l => l.id !== layer.id);
                } else {
                    return [...prev, layer];
                }
            });
        } else {
            setSelectedLegendLayers([layer]);
        }
    };

    return (
        <div className="flex flex-col relative">
            <Tooltip
                content={!canDownload ? 'Necesitas tener al menos una capa activa para descargar' : 'Descargar mapa'}
                placement="top"
                delay={300}
            >
                <button
                    ref={anchorRef}
                    type="button"
                    onClick={handleDownloadClick}
                    disabled={!canDownload || isDownloading}
                    className={[
                        'flex items-center justify-center',
                        'text-center w-12.5 md:w-[235px] h-12.5 rounded-[30px] transition ',
                        'font-garet font-bold text-[14px]/[47px] hover:shadow-[0_6px_6px_#5C247234]',
                        canDownload ? 'bg-[#703089] text-white hover:bg-[#5C2472]' : 'bg-black/5 text-black/40 cursor-not-allowed',
                    ].join(' ')}
                >
                    {isMobile ? <Icon name="download" /> : (isDownloading ? 'Generando…' : 'Descargar visualización')}
                </button>
            </Tooltip>

            <Panel
                open={isPanelOpen}
                anchorRef={anchorRef}
                onClose={() => setIsPanelOpen(false)}
                variant="solid"
                width="w-80"
                maxHeight="max-h-200"
                className="z-50 mt-2 shadow-none border-none rounded-[14px]"
                placement="bottom-end"
                title={<span className="font-garet font-bold text-[14px]/[47px]">Descargar mapa</span>}
                mobileFullscreen={isMobile}
            >
                <div className="flex flex-col px-4 pb-4 gap-4">

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb">
                        Formato
                    </div>
                    <div className="flex gap-2 mb-2">
                        {['png', 'jpeg', 'pdf'].map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => setFormat(fmt)}
                                className={`
                                    px-3 py-1.5 text-sm rounded-[14px] border transition-colors 
                                    ${format === fmt
                                        ? 'bg-[#FF8300] border-transparent text-white font-medium'
                                        : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white'
                                    }
                                `}
                            >
                                {fmt.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <QualitySelector
                        value={qualityIndex}
                        onChange={setQualityIndex}
                        isPanelOpen={isPanelOpen}
                    />

                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Vista
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setViewType('viewport')}
                                className={`
                                    px-3 py-2 text-sm rounded-[14px] border transition-colors text-left 
                                    ${viewType === 'viewport'
                                        ? 'bg-[#FF8300] border-transparent text-white font-medium'
                                        : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white'
                                    }
                                `}
                            >
                                <div className="font-medium">Seleccionar Área (Vista actual)</div>
                                <div className="text-xs opacity-75">Activar recuadro de recorte manual</div>
                            </button>
                            <button
                                onClick={() => setViewType('full-state')}
                                className={`
                                    px-3 py-2 text-sm rounded-[14px] border transition-colors text-left 
                                    ${viewType === 'full-state'
                                        ? 'bg-[#703089] border-[#703089] text-white font-medium'
                                        : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white'
                                    }
                                `}
                            >
                                <div className="font-medium">Estado completo</div>
                                <div className="text-xs opacity-75">Automático (Todo Jalisco)</div>
                            </button>
                        </div>
                    </div>

                    {layersWithLegends.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {format === 'pdf' ? 'Leyendas' : 'Leyenda'}
                            </div>

                            <ScrollContainer className="max-h-40 border border-gray-100 rounded">
                                {layersWithLegends.map(layer => {
                                    const isSelected = selectedLegendLayers.some(l => l.id === layer.id);
                                    return (
                                        <SymbologyItem
                                            key={layer.id}
                                            layer={layer}
                                            isExpanded={false}
                                            onToggle={() => { }}
                                            showDivider={true}
                                            simple={true}
                                            onClick={() => handleLayerSelect(layer)}
                                            prefix={
                                                <input
                                                    type={format === 'pdf' ? 'checkbox' : 'radio'}
                                                    name="legend-selection"
                                                    checked={isSelected}
                                                    readOnly
                                                    className={`text-[#703089] focus:ring-[#703089] mr-2 ${format === 'pdf' ? 'rounded' : ''}`}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            }
                                        />
                                    );
                                })}
                            </ScrollContainer>
                        </div>
                    )}

                    <button
                        onClick={handleConfirmDownload}
                        className="w-full py-2 bg-[#703089] text-white rounded-[14px] hover:bg-[#5C2472] transition font-medium text-sm"
                    >
                        {viewType === 'viewport' ? 'Seleccionar Área' : `Descargar ${format.toUpperCase()}`}
                    </button>
                </div>
            </Panel>
        </div>
    );
};

export default Download;
