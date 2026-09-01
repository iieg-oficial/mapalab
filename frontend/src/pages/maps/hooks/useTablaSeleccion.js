import { useCallback, useState } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { getCenter } from 'ol/extent';
import { toLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { centerOnResults } from '@pages/maps/helpers/featureGeometry';

const formato = new GeoJSON();

const centroDe = (feature) => {
    if (!feature?.geometry) return null;
    try {
        const geometria = formato.readGeometry(feature.geometry, {
            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:3857',
        });
        const centro = getCenter(geometria.getExtent());
        return Array.isArray(centro) && centro.every(Number.isFinite) ? centro : null;
    } catch {
        return null;
    }
};

export const useTablaSeleccion = (layerId, layerDef) => {
    const { mapRef, setSelectedFeatureInfo, clickPosition } = useMapsContext();
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

        const centro = centroDe(feature);
        const mapa = mapRef?.current;

        if (centro && mapa) {
            const pixel = mapa.getPixelFromCoordinate(centro);
            if (pixel) clickPosition?.updatePosition({ pixel });
        }

        const [lng, lat] = centro ? toLonLat(centro) : [null, null];

        setSelectedFeatureInfo({
            lngLat: Number.isFinite(lng) ? { lng, lat } : null,
            results,
            queriedLayerName: nombre,
            queriedLayerId: layerId,
        });

        centerOnResults({ activeMap: mapa, results, clickPosition });
    }, [clickPosition, layerDef, layerId, mapRef, setSelectedFeatureInfo]);

    return { seleccionada, seleccionar };
};
