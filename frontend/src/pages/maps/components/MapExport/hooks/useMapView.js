import { useMapsContext } from '@hooks/useMaps';
import { JALISCO_BOUNDS } from '../../../helpers/wmsConfig';
import { fromLonLat, transformExtent } from 'ol/proj';
import { boundingExtent } from 'ol/extent';

export const useMapView = () => {
    const { mapRef, paneMapRefs, compareMode } = useMapsContext();

    const getActiveMapRef = () => {
        if (compareMode?.active && paneMapRefs?.current?.[0]?.current) {
            return paneMapRefs.current[0];
        }
        return mapRef;
    };

    const getViewportExtent = () => {
        const ref = getActiveMapRef();
        if (!ref?.current) return null;
        const view = ref.current.getView();
        const extent = view.calculateExtent(ref.current.getSize());
        return transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    };

    const adjustViewToFullState = () => {
        const ref = getActiveMapRef();
        if (!ref.current) return null;

        const view = ref.current.getView();
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
        const ref = getActiveMapRef();
        if (!ref.current || !originalView) return;

        const view = ref.current.getView();
        view.setCenter(originalView.center);
        view.setZoom(originalView.zoom);
    };

    return {
        getViewportExtent,
        adjustViewToFullState,
        restoreView,
        getActiveMapRef
    };
};
