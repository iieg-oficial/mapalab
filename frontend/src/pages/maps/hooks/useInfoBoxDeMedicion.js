import { useEffect, useRef } from 'react';
import { toLonLat } from 'ol/proj';

export const abrirInfoBoxDeLinea = ({ geometria, pixel, setSelectedFeatureInfo, clickPosition, centrado = false }) => {
    const [lng, lat] = toLonLat(geometria.getLastCoordinate());
    if (centrado) clickPosition?.clearPosition?.();
    else clickPosition?.updatePosition?.({ pixel });
    setSelectedFeatureInfo?.({ lngLat: { lng, lat }, results: [], medicion: geometria, centrado });
};

export const abrirInfoBoxDeMedicion = ({ medicion, setSelectedFeatureInfo, clickPosition }) => {
    const geometria = medicion?.feature?.getGeometry() || medicion?.geometry;
    if (!geometria) return;
    abrirInfoBoxDeLinea({ geometria, setSelectedFeatureInfo, clickPosition, centrado: true });
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
