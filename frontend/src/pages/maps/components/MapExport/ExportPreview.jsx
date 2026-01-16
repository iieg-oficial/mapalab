import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMapsContext } from '@hooks/useMaps';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '../../hooks/useWMSLegend';
import html2canvas from 'html2canvas';
import coordinateGrid from './utils/coordinateGrid';
import northArrow from './utils/northArrow';
import createExportSidePanel from './ExportSidePanel';
import createExportLegendsLayout from './ExportLegendsLayout';
import { layers as allLayers, findLayerById } from '../../helpers/layers/index';
import { JALISCO_BOUNDS } from '../../helpers/wmsConfig';
import { transformExtent, fromLonLat } from 'ol/proj';
import { boundingExtent } from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';

const ExportPreview = () => {
    const { targetRef, mapRef } = useMapsContext();
    const { getLegendUrl } = useWMSLegend();
    const { activeLayerIds, groupedActiveLayers, selectedLayer } = useContext(MapsContext);
    const [isOpen, setIsOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [legendsPreviewUrl, setLegendsPreviewUrl] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('map');
    const [title, setTitle] = useState('');
    const [viewType, setViewType] = useState('viewport');
    const containerRef = useRef(null);

    const activeLayers = activeLayerIds
        .map(id => findLayerById(id, allLayers))
        .filter(Boolean);

    const layersWithLegends = useMemo(() => {
        return groupedActiveLayers.filter(layer => {
            const url = getLegendUrl(layer);
            return url !== null;
        });
    }, [groupedActiveLayers, getLegendUrl]);

    const currentSelectedLegend = useMemo(() => {
        if (selectedLayer) {
            const found = layersWithLegends.find(l => l.id === selectedLayer.id);
            if (found) return found;
        }
        return layersWithLegends[0] || null;
    }, [selectedLayer, layersWithLegends]);

    useEffect(() => {
        if (currentSelectedLegend) {
            setTitle(currentSelectedLegend.label || currentSelectedLegend.name || 'Mapa sin título');
        } else if (activeLayers.length > 0) {
            setTitle(activeLayers[0].label || activeLayers[0].name || 'Mapa sin título');
        } else {
            setTitle('Mapa sin título');
        }
    }, [currentSelectedLegend, activeLayers]);

    const getViewportExtent = () => {
        if (!mapRef?.current) return null;
        const view = mapRef.current.getView();
        const extent = view.calculateExtent(mapRef.current.getSize());
        return transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    };

    const adjustViewToFullState = () => {
        if (!mapRef.current) return null;

        const view = mapRef.current.getView();
        const originalCenter = view.getCenter();
        const originalZoom = view.getZoom();

        const [minLon, minLat, maxLon, maxLat] = JALISCO_BOUNDS.coords;
        const extent = boundingExtent([
            fromLonLat([minLon, minLat]),
            fromLonLat([maxLon, maxLat])
        ]);

        view.fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 0
        });

        return { center: originalCenter, zoom: originalZoom };
    };

    const restoreView = (originalView) => {
        if (!mapRef.current || !originalView) return;

        const view = mapRef.current.getView();
        view.setCenter(originalView.center);
        view.setZoom(originalView.zoom);
    };

    const waitForMapTilesToLoad = () => {
        return new Promise((resolve) => {
            const maxWaitTime = 8000;
            const startTime = Date.now();

            const checkLoading = () => {
                const loadingElement = document.querySelector('.animate-spin');
                const isLoading = loadingElement !== null;

                if (!isLoading || Date.now() - startTime > maxWaitTime) {
                    setTimeout(resolve, 500);
                } else {
                    setTimeout(checkLoading, 200);
                }
            };

            setTimeout(checkLoading, 1000);
        });
    };

    const hideNonLimitLayers = () => {
        if (!mapRef.current) return [];

        const hiddenLayers = [];
        const limitLayerIds = ['limite_iieg', 'limite_inegi'];
        const olLayers = mapRef.current.getLayers().getArray();

        olLayers.forEach(layer => {
            const layerId = layer.get('layerId') || layer.get('id');
            const zIndex = layer.getZIndex();
            const isBaseMap = zIndex === -1;
            const isLimitLayer = layerId && limitLayerIds.includes(layerId);

            if (!isBaseMap && !isLimitLayer && layer.getVisible()) {
                hiddenLayers.push(layer);
                layer.setVisible(false);
            }
        });

        return hiddenLayers;
    };

    const restoreLayers = (hiddenLayers) => {
        hiddenLayers.forEach(layer => {
            layer.setVisible(true);
        });
    };

    const createTemporaryLimitLayer = () => {
        if (!mapRef.current) return null;

        const limitLayerName = 'general:limite_iieg';
        const wmsSource = new ImageWMS({
            url: `${import.meta.env.VITE_GEOSERVER_URL}general/wms`,
            params: {
                'LAYERS': limitLayerName,
                'FORMAT': 'image/png',
                'TRANSPARENT': true,
                'VERSION': '1.1.0',
                'SRS': 'EPSG:6368'
            },
            ratio: 1,
            serverType: 'geoserver',
            crossOrigin: 'anonymous'
        });

        const limitLayer = new ImageLayer({
            source: wmsSource,
            visible: true,
            zIndex: 1000
        });

        mapRef.current.addLayer(limitLayer);
        return limitLayer;
    };

    const removeTemporaryLayer = (layer) => {
        if (mapRef.current && layer) {
            mapRef.current.removeLayer(layer);
        }
    };

    const generateMinimapImage = async () => {
        if (!mapRef.current || !targetRef.current) return null;

        const hiddenLayers = hideNonLimitLayers();
        const tempLimitLayer = createTemporaryLimitLayer();
        await new Promise(resolve => setTimeout(resolve, 500));

        const originalView = adjustViewToFullState();
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const fullCanvas = await html2canvas(targetRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 1
            });

            const targetWidth = 515;
            const targetHeight = 430;

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = targetWidth;
            croppedCanvas.height = targetHeight;
            const ctx = croppedCanvas.getContext('2d');

            const aspectRatio = targetWidth / targetHeight;
            const canvasAspectRatio = fullCanvas.width / fullCanvas.height;

            let sourceX, sourceY, sourceW, sourceH;

            if (canvasAspectRatio > aspectRatio) {
                sourceH = fullCanvas.height;
                sourceW = sourceH * aspectRatio;
                sourceX = (fullCanvas.width - sourceW) / 2;
                sourceY = 0;
            } else {
                sourceW = fullCanvas.width;
                sourceH = sourceW / aspectRatio;
                sourceX = 0;
                sourceY = (fullCanvas.height - sourceH) / 2;
            }

            ctx.drawImage(
                fullCanvas,
                sourceX, sourceY, sourceW, sourceH,
                0, 0, targetWidth, targetHeight
            );

            return croppedCanvas.toDataURL('image/png');
        } finally {
            restoreLayers(hiddenLayers);
            removeTemporaryLayer(tempLimitLayer);
            restoreView(originalView);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };

    const generatePreview = async () => {
        if (!targetRef.current || activeLayers.length === 0) return;

        setIsGenerating(true);

        let originalView = null;
        let currentViewportExtent = getViewportExtent();

        try {
            const minimapImageUrl = await generateMinimapImage();

            if (viewType === 'full-state') {
                originalView = adjustViewToFullState();
                await waitForMapTilesToLoad();
            }

            const mapCanvas = await html2canvas(targetRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 1
            });

            const extent = getViewportExtent();
            const sidePanelWidth = 280;
            const totalWidth = mapCanvas.width + sidePanelWidth;

            const tempContainer = document.createElement('div');
            Object.assign(tempContainer.style, {
                position: 'absolute',
                left: '-9999px',
                width: `${totalWidth}px`,
                height: `${mapCanvas.height}px`,
                backgroundColor: '#ffffff'
            });

            const mapSection = document.createElement('div');
            Object.assign(mapSection.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: `${mapCanvas.width}px`,
                height: `${mapCanvas.height}px`
            });

            const mapImage = document.createElement('img');
            mapImage.src = mapCanvas.toDataURL('image/png');
            Object.assign(mapImage.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '1'
            });

            const arrow = northArrow();
            const grid = coordinateGrid(mapCanvas.width, mapCanvas.height, extent);

            mapSection.appendChild(mapImage);
            mapSection.appendChild(grid);
            mapSection.appendChild(arrow);

            tempContainer.appendChild(mapSection);

            const sidePanel = createExportSidePanel({
                title,
                captureDate: new Date(),
                selectedLegend: currentSelectedLegend,
                getLegendUrl,
                viewType,
                viewportExtent: viewType === 'viewport' ? currentViewportExtent : null,
                minimapImageUrl,
                source: 'Por definir'
            });
            sidePanel.style.left = 'auto';
            sidePanel.style.right = '0';
            tempContainer.appendChild(sidePanel);

            document.body.appendChild(tempContainer);

            await new Promise((resolve) => {
                if (mapImage.complete) resolve();
                else mapImage.onload = resolve;
            });

            const panelImages = sidePanel.querySelectorAll('img');
            await Promise.all(Array.from(panelImages).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const finalCanvas = await html2canvas(tempContainer, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scale: 1,
                logging: false
            });

            document.body.removeChild(tempContainer);
            setPreviewUrl(finalCanvas.toDataURL('image/png'));

            if (layersWithLegends.length > 0) {
                const legendsContainer = createExportLegendsLayout(layersWithLegends, getLegendUrl);
                document.body.appendChild(legendsContainer);

                const legendImages = legendsContainer.querySelectorAll('img');
                await Promise.all(Array.from(legendImages).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                }));

                const legendsCanvas = await html2canvas(legendsContainer, {
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    scale: 1,
                    logging: false
                });

                document.body.removeChild(legendsContainer);
                setLegendsPreviewUrl(legendsCanvas.toDataURL('image/png'));
            }

        } catch (error) {
            console.error('Error generando preview:', error);
        } finally {
            if (originalView) {
                restoreView(originalView);
            }
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            generatePreview();
        }
    }, [isOpen]);

    if (import.meta.env.PROD) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
                🖼️ Preview Export
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
                    <div ref={containerRef} className="bg-white rounded-2xl shadow-2xl max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-bold">Export Preview (Dev)</h2>
                                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setActiveTab('map')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${activeTab === 'map' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                    >
                                        Mapa
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('legends')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${activeTab === 'legends' ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                                    >
                                        Leyendas (PDF)
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={generatePreview}
                                    disabled={isGenerating}
                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
                                >
                                    {isGenerating ? 'Generando...' : '🔄 Refresh'}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-gray-800 text-2xl leading-none px-2"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">Título:</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Título del mapa"
                            />
                            <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
                                <button
                                    onClick={() => setViewType('viewport')}
                                    className={`px-3 py-1 rounded-md text-xs transition-colors ${viewType === 'viewport' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Vista actual
                                </button>
                                <button
                                    onClick={() => setViewType('full-state')}
                                    className={`px-3 py-1 rounded-md text-xs transition-colors ${viewType === 'full-state' ? 'bg-white shadow' : 'text-gray-600'}`}
                                >
                                    Estado completo
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-b bg-gray-50">
                            <label className="text-sm font-medium text-gray-700 mr-2">Leyenda:</label>
                            <select
                                value={currentSelectedLegend?.id || ''}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                disabled
                            >
                                {layersWithLegends.map(layer => (
                                    <option key={layer.id} value={layer.id}>
                                        {layer.label || layer.name}
                                    </option>
                                ))}
                            </select>
                            <span className="ml-2 text-xs text-gray-500">(capa seleccionada)</span>
                        </div>

                        <div className="flex-1 overflow-auto p-4 bg-gray-100">
                            {isGenerating ? (
                                <div className="flex items-center justify-center h-96">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Generando preview...</p>
                                    </div>
                                </div>
                            ) : activeTab === 'map' && previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Export Preview"
                                    className="max-w-full h-auto shadow-lg rounded-lg mx-auto"
                                />
                            ) : activeTab === 'legends' && legendsPreviewUrl ? (
                                <img
                                    src={legendsPreviewUrl}
                                    alt="Legends Preview"
                                    className="max-w-full h-auto shadow-lg rounded-lg mx-auto"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-96">
                                    <p className="text-gray-500">
                                        {activeLayers.length === 0
                                            ? 'Agrega capas para generar preview'
                                            : 'Click en Refresh para generar preview'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
                            <span>Capas activas: {activeLayers.length}</span>
                            <span className="mx-2">|</span>
                            <span>Leyenda: {currentSelectedLegend?.label || 'Ninguna'}</span>
                            <span className="mx-2">|</span>
                            <span>Vista: {viewType === 'full-state' ? 'Estado completo' : 'Viewport'}</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default ExportPreview;
