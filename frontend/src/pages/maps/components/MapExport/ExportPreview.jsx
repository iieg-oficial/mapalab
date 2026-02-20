import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import GuideOverlay from './GuideOverlay';
import { useZenMode } from '../ZenMode';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '../../hooks/useWMSLegend';
import { useMapDownload } from './hooks/useMapDownload';
import { useMinimap } from './hooks/useMinimap';
import { useMapCapture } from './hooks/useMapCapture';
import { useImageComposition } from './hooks/useImageComposition';
import { usePdfExport } from './hooks/usePdfExport';
import { layers as allLayers, findLayerById } from '../../helpers/layers/index';
import { EXPORT_DIMENSIONS, QUALITY_PRESETS } from './utils/exportDimensions';
import { getLayersSources } from '@services/layerMetadataService';
import Loading from '@components/Loading';
import Icon from '@components/Icon';

const ExportPreview = ({ isOpen, onClose, format = 'png', selectedLegends: propSelectedLegends = [], initialTitle = '', quality = QUALITY_PRESETS[1] }) => {
    const { targetRef } = useMapsContext();
    const { getLegendUrl } = useWMSLegend();
    const { activeLayerIds, groupedActiveLayers } = useContext(MapsContext);
    const { getGuideExtent } = useMapDownload();
    const { generateMinimapImage } = useMinimap();
    const { getMapSnapshot } = useMapCapture();
    const { composeExportImage } = useImageComposition();
    const { exportToPdf, exportToImage } = usePdfExport();
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewCanvas, setPreviewCanvas] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [title, setTitle] = useState('');
    const [capturedExtent, setCapturedExtent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const containerRef = useRef(null);
    const { isZenMode, setIsZenMode } = useZenMode();

    const activeLayers = activeLayerIds
        .map(id => findLayerById(id, allLayers))
        .filter(Boolean);

    useEffect(() => {
        if (isOpen) {
            setCapturedExtent(null);
            setPreviewUrl(null);
            setShowModal(false);
            setIsZenMode(true);
        } else {
            setIsZenMode(false);
            setShowModal(false);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => setIsZenMode(false);
    }, []);


    useEffect(() => {
        if (capturedExtent && activeLayers.length > 0) {
            setShowModal(true);
            setPreviewCanvas(null);
            generatePreview();
        }
    }, [capturedExtent]);

    const currentSelectedLegend = useMemo(() => {
        if (propSelectedLegends.length > 0) return propSelectedLegends[0];
        return groupedActiveLayers.find(layer => getLegendUrl(layer) !== null) || null;
    }, [propSelectedLegends, groupedActiveLayers, getLegendUrl]);

    useEffect(() => {
        if (initialTitle) {
            setTitle(initialTitle);
        } else {
            const layer = currentSelectedLegend || activeLayers[0];
            setTitle(layer?.label || layer?.name || 'Mapa sin título');
        }
    }, [initialTitle, currentSelectedLegend, activeLayers]);

    const generatePreview = async () => {
        if (!targetRef.current || activeLayers.length === 0 || !capturedExtent) return;

        setIsGenerating(true);

        const { SIDE_PANEL_WIDTH } = EXPORT_DIMENSIONS;
        const { mapWidth, mapHeight, captureScale, composeScale } = quality;

        try {
            const { url: minimapImageUrl, bounds: minimapBounds } = generateMinimapImage('viewport');

            const mapCanvas = await getMapSnapshot({
                extent: capturedExtent,
                viewType: 'viewport',
                mapWidth,
                mapHeight,
                captureScale
            });

            const sourcesMap = await getLayersSources(activeLayerIds).catch(() => ({}));
            const source = Object.values(sourcesMap)
                .filter(Boolean)
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .join(', ') || 'Por definir';

            const finalCanvas = await composeExportImage({
                mapCanvas,
                extent: capturedExtent,
                sidePanelWidth: SIDE_PANEL_WIDTH,
                title,
                selectedLegend: currentSelectedLegend,
                getLegendUrl,
                viewType: 'viewport',
                viewportExtent: capturedExtent,
                minimapImageUrl,
                minimapBounds,
                source,
                scale: composeScale
            });

            setPreviewCanvas(finalCanvas);
            setPreviewUrl(finalCanvas.toDataURL('image/png'));

        } catch (error) {
            console.error('Error generando preview:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmCapture = () => {
        const extent = getGuideExtent();
        setCapturedExtent(extent);
        setIsZenMode(false);
    };

    const handleCancelCapture = () => {
        setIsZenMode(false);
        if (onClose) onClose();
    };

    const handleClose = () => {
        setShowModal(false);
        setCapturedExtent(null);
        setPreviewUrl(null);
        if (onClose) onClose();
    };

    const handleDownload = async () => {
        if (!previewCanvas) return;

        if (format === 'pdf') {
            const legends = propSelectedLegends.length > 0 ? propSelectedLegends : (currentSelectedLegend ? [currentSelectedLegend] : []);
            await exportToPdf({ canvas: previewCanvas, title, selectedLegends: legends, getLegendUrl });
        } else {
            exportToImage(previewCanvas, format, title);
        }
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <GuideOverlay
                visible={isZenMode && !showModal}
                aspectRatio={EXPORT_DIMENSIONS.MAP_ASPECT_RATIO}
                onConfirm={handleConfirmCapture}
                onCancel={handleCancelCapture}
            />

            {showModal && createPortal(
                <div className="fixed inset-0 bg-black/80 z-[9999] flex flex-col items-center justify-center p-4 gap-6">
                    <div
                        ref={containerRef}
                        className="relative shadow-2xl flex flex-col max-w-[85vw] max-h-[85vh]"
                    >
                        <div className="absolute top-0 left-0 bg-[#703089] text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wide z-10">
                            Vista Previa
                        </div>

                        <div className="flex items-center justify-center p-4 min-h-[300px]">
                            {isGenerating && (
                                <Loading
                                    visible={true}
                                    size="h-12 w-12"
                                    color="border-[#703089]"
                                />
                            )}
                            {!isGenerating && previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Export Preview"
                                    className="max-w-[85vw] max-h-[75vh] object-contain shadow-lg rounded-lg"
                                />
                            )}
                            {!isGenerating && !previewUrl && (
                                <p className="text-gray-500">
                                    {activeLayers.length === 0
                                        ? 'Agrega capas para generar preview'
                                        : 'Generando...'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleClose}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 transition-all font-bold text-sm cursor-pointer"
                        >
                            <Icon name="close" className="w-4 h-4" />
                            Cancelar
                        </button>
                        {!isGenerating && (
                            <button
                                onClick={handleDownload}
                                disabled={!previewUrl || isGenerating}
                                className="flex items-center gap-2 px-6 py-2 bg-[#703089] text-white rounded-full shadow-lg hover:bg-[#5C2472] transition-all font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name="download" className="w-4 h-4" />
                                Descargar {format.toUpperCase()}
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default ExportPreview;
