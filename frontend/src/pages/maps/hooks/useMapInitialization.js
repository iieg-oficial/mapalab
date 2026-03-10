import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';

export const useMapInitialization = ({ targetRef, mapRef, baseMapRef, basemaps, baseMapId }) => {
    const [searchParams] = useSearchParams();

    const initialViewParams = useMemo(() => {
        const zoom = searchParams.get('zoom');
        const lat = searchParams.get('lat');
        const lon = searchParams.get('lon');

        return {
            center: (lat && lon) ? fromLonLat([parseFloat(lon), parseFloat(lat)]) : fromLonLat(window.innerWidth < 768 ? [-103.6, 20.6] : [-103.8, 20.85]),
            zoom: zoom ? parseFloat(zoom) : (window.innerWidth < 768 ? 7 : 8.3)
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

        const initialLayers = [
            new TileLayer({ source: basemaps[baseMapId].create(), zIndex: -1 })
        ];

        const map = new OLMap({
            target: targetRef.current,
            layers: initialLayers,
            view: new View({
                center: initialViewParams.center,
                zoom: initialViewParams.zoom,
                minZoom: window.innerWidth < 768 ? 7 : 8,
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

        return () => {
            if (mapRef.current) {
                mapRef.current.setTarget(undefined);
            }
            mapRef.current = null;
            baseMapRef.current = null;
            HTMLCanvasElement.prototype.getContext = originalGetContext;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return initialViewParams;
};
