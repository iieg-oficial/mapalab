import { useEffect } from 'react';

export const useBaseMapManager = (baseMapRef, basemaps, baseMapId, mapRef, labelsOverlayRef = null) => {
    useEffect(() => {
        if (baseMapRef.current) {
            const config = basemaps[baseMapId];
            if (!config) return;
            const source = config.create();

            if (source === null) {
                baseMapRef.current.setVisible(false);
                if (labelsOverlayRef?.current) labelsOverlayRef.current.setVisible(false);
            } else {
                baseMapRef.current.setVisible(true);
                baseMapRef.current.setSource(source);
                baseMapRef.current.setZIndex(-1);
                if (labelsOverlayRef?.current) {
                    const overlaySource = config.createLabelsOverlay ? config.createLabelsOverlay() : null;
                    labelsOverlayRef.current.setSource(overlaySource);
                }
            }
        }
    }, [baseMapRef, baseMapId, basemaps, labelsOverlayRef]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map || !labelsOverlayRef) return;

        const config = basemaps[baseMapId];
        if (!config) return;
        if (!config.labelZoomThreshold || !config.createLabelsOverlay) {
            if (labelsOverlayRef.current) labelsOverlayRef.current.setVisible(false);
            return;
        }

        const evaluate = () => {
            if (!labelsOverlayRef.current || !baseMapRef.current?.getVisible()) return;
            const zoom = map.getView().getZoom();
            const shouldShow = zoom >= config.labelZoomThreshold;
            if (labelsOverlayRef.current.getVisible() !== shouldShow) {
                labelsOverlayRef.current.setVisible(shouldShow);
            }
        };

        evaluate();
        map.on('moveend', evaluate);
        return () => map.un('moveend', evaluate);
    }, [mapRef, baseMapRef, baseMapId, basemaps, labelsOverlayRef]);
};
