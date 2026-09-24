import { useEffect, useRef } from 'react';
import { toLonLat } from 'ol/proj';

export const abrirInfoBoxDeLinea = ({ geometria, pixel, setSelectedFeatureInfo, clickPosition }) => {
    const [lng, lat] = toLonLat(geometria.getLastCoordinate());
    clickPosition?.updatePosition?.({ pixel });
    setSelectedFeatureInfo?.({ lngLat: { lng, lat }, results: [], medicion: geometria });
};

export const useInfoBoxDeMedicion = ({ measurements, mapRef, setSelectedFeatureInfo, clickPosition }) => {
    const vistasRef = useRef(null);

    useEffect(() => {
        if (!vistasRef.current) {
            vistasRef.current = new Set(measurements.map(m => m.id));
            return;
        }
        const nueva = measurements.find(m => !vistasRef.current.has(m.id));
        measurements.forEach(m => vistasRef.current.add(m.id));
        const geometria = nueva?.type === 'LineString' ? nueva.feature?.getGeometry() : null;
        const map = mapRef?.current;
        if (!geometria || !map) return;
        abrirInfoBoxDeLinea({ geometria, pixel: map.getPixelFromCoordinate(geometria.getLastCoordinate()), setSelectedFeatureInfo, clickPosition });
    }, [measurements, mapRef, setSelectedFeatureInfo, clickPosition]);
};
