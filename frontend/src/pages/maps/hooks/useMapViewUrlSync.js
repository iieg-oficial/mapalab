import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { toLonLat } from 'ol/proj';

export const useMapViewUrlSync = (mapRef) => {
    const [, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const view = map.getView();
        let timeoutId = null;
        let isUpdating = false;

        const updateUrlParams = () => {
            if (isUpdating) return;

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                const center = view.getCenter();
                const zoom = view.getZoom();

                if (center && zoom !== undefined) {
                    isUpdating = true;
                    const [lon, lat] = toLonLat(center);

                    requestAnimationFrame(() => {
                        setSearchParams(prev => {
                            const newParams = new URLSearchParams(prev);
                            const newZoom = zoom.toFixed(2);
                            const newLat = lat.toFixed(6);
                            const newLon = lon.toFixed(6);

                            if (prev.get('zoom') !== newZoom ||
                                prev.get('lat') !== newLat ||
                                prev.get('lon') !== newLon) {
                                newParams.set('zoom', newZoom);
                                newParams.set('lat', newLat);
                                newParams.set('lon', newLon);
                                return newParams;
                            }
                            return prev;
                        }, { replace: true });

                        isUpdating = false;
                    });
                }
            }, 300);
        };

        map.on('moveend', updateUrlParams);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            map.un('moveend', updateUrlParams);
        };
    }, [mapRef, setSearchParams]);
};
