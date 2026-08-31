import { useCallback, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { centerOnResults } from '@pages/maps/helpers/featureGeometry';

export const useTablaSeleccion = (layerId, layerDef) => {
    const { mapRef, setSelectedFeatureInfo } = useMapsContext();
    const [seleccionada, setSeleccionada] = useState(null);

    const seleccionar = useCallback((feature) => {
        if (!feature) return;
        setSeleccionada(feature.id || null);

        const nombre = layerDef?.label || layerDef?.name || 'Capa';
        const results = [{
            layerId,
            layerName: nombre,
            features: [feature],
            cachedFeatures: [feature],
            totalAvailable: 1,
            displayCap: 1,
        }];

        setSelectedFeatureInfo({
            lngLat: null,
            results,
            queriedLayerName: nombre,
            queriedLayerId: layerId,
        });

        centerOnResults({ activeMap: mapRef?.current, results });
    }, [layerDef, layerId, mapRef, setSelectedFeatureInfo]);

    return { seleccionada, seleccionar };
};
