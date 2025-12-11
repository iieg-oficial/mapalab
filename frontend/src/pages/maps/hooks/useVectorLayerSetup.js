import { useEffect } from 'react';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';

export const useVectorLayerSetup = (mapRef, getStyleForType, vectorSourceRef, vectorLayerRef) => {
    useEffect(() => {
        const mapInstance = mapRef.current;
        if (!mapInstance || vectorLayerRef.current) return;

        const source = new VectorSource();
        const vector = new VectorLayer({
            source,
            style: getStyleForType,
            zIndex: 1000,
        });

        mapInstance.addLayer(vector);
        vectorSourceRef.current = source;
        vectorLayerRef.current = vector;

        return () => {
            if (mapInstance) {
                mapInstance.removeLayer(vector);
            }
            if (vectorLayerRef.current === vector) {
                vectorLayerRef.current = null;
            }
            if (vectorSourceRef.current === source) {
                vectorSourceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapRef, vectorSourceRef, vectorLayerRef]);

    useEffect(() => {
        if (vectorLayerRef.current) {
            vectorLayerRef.current.setStyle(getStyleForType);
            vectorLayerRef.current.changed();
        }
    }, [getStyleForType, vectorLayerRef]);
};
