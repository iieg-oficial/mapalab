import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import { getDefaultMapView, getMinZoom } from '@pages/maps/helpers/defaultView';
import { RELIEF_OVERLAY, RELIEF_OVERLAY_Z_INDEX } from '@pages/maps/helpers/basemaps';

export const useMapInitialization = ({ targetRef, mapRef, baseMapRef, labelsOverlayRef, reliefOverlayRef, basemaps, baseMapId }) => {
    const [searchParams] = useSearchParams();
    const [mapInstance, setMapInstance] = useState(null);

    const initialViewParams = useMemo(() => {
        const zoom = searchParams.get('zoom');
        const lat = searchParams.get('lat');
        const lon = searchParams.get('lon');
        const layersParam = searchParams.get('layers');
        const hasLayers = !!(layersParam && layersParam.trim().length > 0);
        const defaults = getDefaultMapView();

        return {
            center: (hasLayers && lat && lon) ? fromLonLat([parseFloat(lon), parseFloat(lat)]) : defaults.center,
            zoom: (hasLayers && zoom) ? parseFloat(zoom) : defaults.zoom
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!targetRef.current || mapRef.current) return;

        const originalGetContext = HTMLCanvasElement.prototype.getContext;

        HTMLCanvasElement.prototype.getContext = function (contextType, contextAttributes) {
            if (contextType === '2d') {
                return originalGetContext.call(this, contextType, {
                    ...contextAttributes,
                    willReadFrequently: true
                });
            }
            return originalGetContext.call(this, contextType, contextAttributes);
        };

        const initialConfig = basemaps[baseMapId];
        if (!initialConfig) return;
        const labelsOverlaySource = initialConfig.createLabelsOverlay
            ? initialConfig.createLabelsOverlay()
            : null;
        const reliefLayer = new TileLayer({
            source: RELIEF_OVERLAY.iieg(),
            zIndex: RELIEF_OVERLAY_Z_INDEX,
            visible: baseMapId !== 'sin_mapalab',
        });
        reliefLayer.set('reliefVariant', 'iieg');
        reliefLayer.on('prerender', (evt) => {
            evt.context.globalCompositeOperation = 'multiply';
        });
        reliefLayer.on('postrender', (evt) => {
            evt.context.globalCompositeOperation = 'source-over';
        });

        const initialLayers = [
            new TileLayer({ source: initialConfig.create(), zIndex: -1 }),
            new TileLayer({ source: labelsOverlaySource, zIndex: 9000, visible: false }),
            reliefLayer,
        ];

        const map = new OLMap({
            target: targetRef.current,
            layers: initialLayers,
            view: new View({
                center: initialViewParams.center,
                zoom: initialViewParams.zoom,
                minZoom: getMinZoom(),
                maxZoom: 18,
                projection: 'EPSG:3857'
            }),
            controls: []
        });

        initialLayers.forEach(layer => {
            const source = layer.getSource();
            if (source && source.on) {
                source.on('tileloaderror', () => { });
            }
        });

        mapRef.current = map;
        baseMapRef.current = map.getLayers().item(0);
        if (labelsOverlayRef) labelsOverlayRef.current = map.getLayers().item(1);
        if (reliefOverlayRef) reliefOverlayRef.current = map.getLayers().item(2);
        setMapInstance(map);

        return () => {
            if (mapRef.current) {
                mapRef.current.setTarget(undefined);
            }
            mapRef.current = null;
            baseMapRef.current = null;
            if (labelsOverlayRef) labelsOverlayRef.current = null;
            if (reliefOverlayRef) reliefOverlayRef.current = null;
            setMapInstance(null);
            HTMLCanvasElement.prototype.getContext = originalGetContext;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { initialViewParams, mapInstance };
};
