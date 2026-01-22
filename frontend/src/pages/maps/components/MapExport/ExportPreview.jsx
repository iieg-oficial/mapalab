import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import GuideOverlay from './GuideOverlay';
import { useZenMode } from '../ZenMode';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '../../hooks/useWMSLegend';
import { useMapDownload } from './hooks/useMapDownload';
import { useMapView } from './hooks/useMapView';
import { useMinimap } from './hooks/useMinimap';
import { useMapCapture } from './hooks/useMapCapture';
import { useImageComposition } from './hooks/useImageComposition';
import { layers as allLayers, findLayerById } from '../../helpers/layers/index';
import { transformExtent } from 'ol/proj';
import Loading from '@components/Loading';
import Icon from '@components/Icon';

const ExportPreview = ({ isOpen, onClose, format = 'png', selectedLegend: propSelectedLegend, initialTitle = '' }) => {
    const { targetRef, mapRef } = useMapsContext();
    const { getLegendUrl, getLegendJson } = useWMSLegend();
    const { activeLayerIds, groupedActiveLayers } = useContext(MapsContext);

    const { getGuideExtent } = useMapDownload();
    const { restoreView } = useMapView();
    const { generateMinimapImage } = useMinimap();
    const { waitForTilesToLoad, captureMap } = useMapCapture();
    const { composeExportImage } = useImageComposition();

    const [previewUrl, setPreviewUrl] = useState(null);
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
        if (capturedExtent && activeLayers.length > 0) {
            setShowModal(true);
            generatePreview();
        }
    }, [capturedExtent]);

    const currentSelectedLegend = useMemo(() => {
        if (propSelectedLegend) return propSelectedLegend;
        return groupedActiveLayers.find(layer => getLegendUrl(layer) !== null) || null;
    }, [propSelectedLegend, groupedActiveLayers, getLegendUrl]);

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

        let originalView = null;
        let originalSize = null;

        const LOGICAL_MAP_WIDTH = 1020;
        const LOGICAL_HEIGHT = 850;
        const SIDE_PANEL_WIDTH = 255;

        try {
            const minimapImageUrl = await generateMinimapImage();

            if (mapRef.current && targetRef.current) {
                originalSize = {
                    width: targetRef.current.style.width,
                    height: targetRef.current.style.height
                };

                targetRef.current.style.width = `${LOGICAL_MAP_WIDTH}px`;
                targetRef.current.style.height = `${LOGICAL_HEIGHT}px`;
                mapRef.current.updateSize();
            }

            const extent3857 = transformExtent(capturedExtent, 'EPSG:4326', 'EPSG:3857');
            mapRef.current.getView().fit(extent3857, { size: [LOGICAL_MAP_WIDTH, LOGICAL_HEIGHT] });

            await waitForTilesToLoad();
            const mapCanvas = await captureMap(1);

            if (originalSize && targetRef.current && mapRef.current) {
                targetRef.current.style.width = originalSize.width;
                targetRef.current.style.height = originalSize.height;
                mapRef.current.updateSize();
            }
            if (originalView) {
                restoreView(originalView);
            }

            const finalCanvas = await composeExportImage({
                mapCanvas,
                extent: capturedExtent,
                sidePanelWidth: SIDE_PANEL_WIDTH,
                title,
                selectedLegend: currentSelectedLegend,
                getLegendUrl,
                getLegendJson,
                viewType: 'viewport',
                viewportExtent: capturedExtent,
                minimapImageUrl,
                scale: 1
            });

            setPreviewUrl(finalCanvas.toDataURL('image/png'));

        } catch (error) {
            console.error('Error generando preview:', error);
        } finally {
            if (originalSize && targetRef.current && mapRef.current) {
                targetRef.current.style.width = originalSize.width;
                targetRef.current.style.height = originalSize.height;
                mapRef.current.updateSize();
            }
            if (originalView) {
                restoreView(originalView);
            }
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

    const handleDownload = () => {
        if (!previewUrl) return;

        const link = document.createElement('a');
        link.download = `${title || 'mapa'}.${format}`;
        link.href = previewUrl;
        link.click();
    };

    if (!isOpen) return null;

    return (
        <>
            <GuideOverlay
                visible={isZenMode}
                aspectRatio={1.2}
                onConfirm={handleConfirmCapture}
                onCancel={handleCancelCapture}
            />

            {showModal && createPortal(
                <div className="fixed inset-0 bg-black/50 z-[9999] flex flex-col items-center justify-center p-4 gap-6">
                    <div
                        ref={containerRef}
                        className="relative bg-white shadow-2xl flex flex-col max-w-[90vw] max-h-[calc(85vh - 60px)]"
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
                                    className="max-w-full max-h-[calc(85vh - 60px)] object-contain shadow-lg rounded-lg"
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
