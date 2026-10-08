import { useEffect, useRef } from 'react';

export const useMapInteractions = (mapRef, queryFeatures, disableFeatureSelection = false, markerClickedRef = null, editingClickedRef = null, isClickAllowed = null) => {
    const lastPointerCheckRef = useRef(0);
    const disableSelectionRef = useRef(disableFeatureSelection);
    const isClickAllowedRef = useRef(isClickAllowed);

    useEffect(() => {
        disableSelectionRef.current = disableFeatureSelection;
    }, [disableFeatureSelection]);

    useEffect(() => {
        isClickAllowedRef.current = isClickAllowed;
    }, [isClickAllowed]);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        const handleMapClick = async (evt) => {
            if (disableSelectionRef.current) {
                if (typeof evt.preventDefault === 'function') {
                    evt.preventDefault();
                }
                if (evt.originalEvent && typeof evt.originalEvent.preventDefault === 'function') {
                    evt.originalEvent.preventDefault();
                }
                return;
            }

            if (markerClickedRef?.current) {
                markerClickedRef.current = false;
                return;
            }

            if (editingClickedRef?.current) {
                editingClickedRef.current = false;
                return;
            }

            const coordinate = evt.coordinate;

            if (typeof isClickAllowedRef.current === 'function' && !isClickAllowedRef.current(coordinate)) {
                return;
            }

            const target = map.getTargetElement();
            if (target) {
                target.style.cursor = 'wait';
            }

            try {
                await queryFeatures(map, coordinate, evt);
            } catch (error) {
                console.error('Error handling map click:', error);
            } finally {
                if (target) {
                    target.style.cursor = '';
                }
            }
        };

        const handlePointerMove = (evt) => {
            if (evt.dragging || disableSelectionRef.current) return;

            const now = Date.now();
            if (now - lastPointerCheckRef.current < 50) return;
            lastPointerCheckRef.current = now;

            const pixel = map.getEventPixel(evt.originalEvent);
            let hit;

            try {
                hit = map.hasFeatureAtPixel(pixel);
            } catch {
                hit = map.forEachLayerAtPixel(pixel, (layer) => {
                    return layer.get('layerId') && layer.getVisible();
                });
            }

            const target = map.getTargetElement();
            if (target) {
                target.style.cursor = hit ? 'pointer' : '';
            }
        };

        map.on('singleclick', handleMapClick);
        map.on('pointermove', handlePointerMove);

        return () => {
            map.un('singleclick', handleMapClick);
            map.un('pointermove', handlePointerMove);
        };
    }, [mapRef, queryFeatures, markerClickedRef, editingClickedRef]);
};
