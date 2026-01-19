import { useMapsContext } from '@hooks/useMaps';
import { useMapView } from './useMapView';
import html2canvas from 'html2canvas';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';

export const useMinimap = () => {
    const { targetRef, mapRef } = useMapsContext();
    const { adjustViewToFullState, restoreView } = useMapView();

    const hideNonLimitLayers = () => {
        if (!mapRef.current) return [];

        const hiddenLayers = [];
        const limitLayerIds = ['limite_iieg', 'limite_inegi'];
        const olLayers = mapRef.current.getLayers().getArray();

        olLayers.forEach(layer => {
            const layerId = layer.get('layerId') || layer.get('id');
            const zIndex = layer.getZIndex();
            const isTileBaseMap = zIndex === -1;
            const isLimitLayer = layerId && limitLayerIds.includes(layerId);

            if (!isTileBaseMap && !isLimitLayer && layer.getVisible()) {
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

    return {
        generateMinimapImage
    };
};
