/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useCallback } from 'react';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';

export const useVectorLayerSetup = (mapRef, getStyleForType, vectorSourceRef, vectorLayerRef) => {
    const ensureVectorLayer = useCallback(() => {
        if (!vectorSourceRef.current || !vectorLayerRef.current) {
            const source = new VectorSource();
            vectorLayerRef.current = new VectorLayer({
                source,
                style: getStyleForType,
                zIndex: 1000,
            });
            vectorSourceRef.current = source;
        }

        const mapInstance = mapRef.current;
        if (mapInstance && !mapInstance.getLayers().getArray().includes(vectorLayerRef.current)) {
            mapInstance.addLayer(vectorLayerRef.current);
        }
        return true;
    }, [mapRef, getStyleForType, vectorSourceRef, vectorLayerRef]);

    useEffect(() => {
        ensureVectorLayer();

        return () => {
            const mapInstance = mapRef.current;
            const vector = vectorLayerRef.current;
            const source = vectorSourceRef.current;

            if (mapInstance && vector) {
                mapInstance.removeLayer(vector);
            }
            if (vectorLayerRef.current === vector) {
                vectorLayerRef.current = null;
            }
            if (vectorSourceRef.current === source) {
                vectorSourceRef.current = null;
            }
        };
    }, [mapRef, vectorSourceRef, vectorLayerRef]);

    useEffect(() => {
        if (vectorLayerRef.current) {
            vectorLayerRef.current.setStyle(getStyleForType);
            vectorLayerRef.current.changed();
        }
    }, [getStyleForType, vectorLayerRef]);

    return { ensureVectorLayer };
};
