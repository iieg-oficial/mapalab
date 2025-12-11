import { useState, useRef, useEffect } from 'react';
import Tooltip from '@components/Tooltip';
import Panel from '@components/Panel';
import Icon from '@components/Icon';
import { useMapDownload } from '../hooks/useMapDownload';
import SymbologyItem from './SymbologyItem';

const Download = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedLegendLayers, setSelectedLegendLayers] = useState([]);
    const anchorRef = useRef(null);

    const {
        downloadMap,
        isDownloading,
        canDownload,
        layersWithLegends,
        selectedLayer
    } = useMapDownload();

    useEffect(() => {
        if (layersWithLegends.length > 0) {
            if (selectedLayer) {
                const layerWithLegend = layersWithLegends.find(l => l.id === selectedLayer.id);
                if (layerWithLegend) {
                    setSelectedLegendLayers([layerWithLegend]);
                    return;
                }
            }
            setSelectedLegendLayers(layersWithLegends.slice(0, 1));
        } else {
            setSelectedLegendLayers([]);
        }
    }, [layersWithLegends, selectedLayer]);

    const [format, setFormat] = useState('png');
    const [viewType, setViewType] = useState('viewport');

    useEffect(() => {
        if (layersWithLegends.length > 0) {
            if (format === 'pdf') {
                setSelectedLegendLayers(layersWithLegends);
            } else {
                if (selectedLayer) {
                    const layerWithLegend = layersWithLegends.find(l => l.id === selectedLayer.id);
                    if (layerWithLegend) {
                        setSelectedLegendLayers([layerWithLegend]);
                        return;
                    }
                }

                if (selectedLegendLayers.length !== 1) {
                    setSelectedLegendLayers([layersWithLegends[0]]);
                }
            }
        }
    }, [format, layersWithLegends, selectedLayer]);

    useEffect(() => {
        if (isPanelOpen && layersWithLegends.length > 0) {
            if (format === 'pdf') {
                setSelectedLegendLayers(layersWithLegends);
            } else {
                if (selectedLayer) {
                    const layerWithLegend = layersWithLegends.find(l => l.id === selectedLayer.id);
                    if (layerWithLegend) {
                        setSelectedLegendLayers([layerWithLegend]);
                        return;
                    }
                }

                const currentSelected = selectedLegendLayers[0];
                const stillExists = currentSelected && layersWithLegends.find(l => l.id === currentSelected.id);

                if (!stillExists || selectedLegendLayers.length !== 1) {
                    setSelectedLegendLayers([layersWithLegends[0]]);
                }
            }
        }
    }, [isPanelOpen, format, layersWithLegends, selectedLayer]);

    const handleDownloadClick = () => {
        if (!canDownload || isDownloading) return;
        setIsPanelOpen(true);
    };

    const handleConfirmDownload = async () => {
        setIsPanelOpen(false);
        await downloadMap(format, selectedLegendLayers, viewType);
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
        <div className="flex flex-col gap-2 relative">
            <div className="flex items-center w-full h-auto rounded-lg overflow-hidden shadow-sm">
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
                            'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm transition',
                            canDownload
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-black/5 text-black/40 cursor-not-allowed',
                        ].join(' ')}
                    >
                        {isDownloading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <Icon name="download" className="h-5 w-5" />
                        )}
                        <span className="text-left font-medium hidden md:inline">
                            {isDownloading ? 'Generando…' : 'Descargar'}
                        </span>
                    </button>
                </Tooltip>
            </div>

            <Panel
                open={isPanelOpen}
                anchorRef={anchorRef}
                onClose={() => setIsPanelOpen(false)}
                variant="solid"
                width="w-72"
                className="z-50"
                placement="bottom-end"
                title="Descargar mapa"
                mobileFullscreen
            >
                <div className="flex flex-col p-4 gap-4">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Formato
                        </div>
                        <div className="flex gap-2">
                            {['png', 'jpeg', 'pdf'].map(fmt => (
                                <button
                                    key={fmt}
                                    onClick={() => setFormat(fmt)}
                                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${format === fmt
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {fmt.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Vista
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setViewType('viewport')}
                                className={`px-3 py-2 text-sm rounded border transition-colors text-left ${viewType === 'viewport'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-medium">Vista actual</div>
                                <div className="text-xs opacity-75">Captura el viewport actual</div>
                            </button>
                            <button
                                onClick={() => setViewType('full-state')}
                                className={`px-3 py-2 text-sm rounded border transition-colors text-left ${viewType === 'full-state'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-medium">Estado completo</div>
                                <div className="text-xs opacity-75">Vista de todo Jalisco en formato carta</div>
                            </button>
                        </div>
                    </div>

                    {layersWithLegends.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {format === 'pdf' ? 'Leyendas' : 'Leyenda'}
                            </div>

                            <div className="max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] border border-gray-100 rounded">
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
                                                    className={`text-blue-500 focus:ring-blue-500 mr-2 ${format === 'pdf' ? 'rounded' : ''}`}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleConfirmDownload}
                        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-sm"
                    >
                        Descargar {format.toUpperCase()}
                    </button>
                </div>
            </Panel>
        </div>
    );
};

export default Download;
