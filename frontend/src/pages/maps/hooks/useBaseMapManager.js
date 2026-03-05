import { useEffect, useRef } from 'react';

export const useBaseMapManager = (baseMapRef, basemaps, baseMapId, mapRef) => {
    const hasLabelsRef = useRef(false);

    useEffect(() => {
        if (baseMapRef.current) {
            const config = basemaps[baseMapId];
            const source = config.create();

            if (source === null) {
                baseMapRef.current.setVisible(false);
            } else {
                hasLabelsRef.current = false;
                baseMapRef.current.setVisible(true);
                baseMapRef.current.setSource(source);
                baseMapRef.current.setZIndex(-1);
            }
        }
    }, [baseMapRef, baseMapId, basemaps]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map) return;

        const config = basemaps[baseMapId];
        if (!config.labelZoomThreshold) return;

        const onMoveEnd = () => {
            if (!baseMapRef.current || !baseMapRef.current.getVisible()) return;

            const zoom = map.getView().getZoom();
            const shouldHaveLabels = zoom >= config.labelZoomThreshold;

            if (shouldHaveLabels !== hasLabelsRef.current) {
                hasLabelsRef.current = shouldHaveLabels;
                baseMapRef.current.setSource(config.create(shouldHaveLabels));
            }
        };

        map.on('moveend', onMoveEnd);
        return () => map.un('moveend', onMoveEnd);
    }, [mapRef, baseMapRef, baseMapId, basemaps]);
};
