import { useEffect } from 'react';
import { getLength } from 'ol/sphere';
import { computeAndCacheStyle } from '../helpers/drawingStyles';
import { formatLength, formatArea, formatLengthValue } from '../helpers/formatMeasure';

export const useMeasurementRecalc = ({ vectorSourceRef, vectorLayerRef, sketchFeatureRef, measurementConfig, setMeasurements }) => {
    useEffect(() => {
        if (!vectorSourceRef.current) return;

        setMeasurements(prev => prev.map(m => {
            if (m.type === 'LineString' && m.feature) {
                const geom = m.feature.getGeometry();
                if (!geom) return m;
                const value = formatLength(geom, measurementConfig.lengthUnit);
                return { ...m, value, label: `Distancia: ${value}` };
            }
            if (m.type === 'Polygon' && m.feature) {
                const geom = m.feature.getGeometry();
                if (!geom) return m;
                const area = formatArea(geom, measurementConfig.areaUnit);
                const perimeter = getLength(geom);
                const perimeterText = formatLengthValue(perimeter, measurementConfig.lengthUnit);
                return { ...m, value: area, label: `Área: ${area}\nPerímetro: ${perimeterText}` };
            }
            return m;
        }));

        const features = vectorSourceRef.current.getFeatures();
        features.forEach(feature => {
            if (feature === sketchFeatureRef.current) {
                return;
            }

            const annotationType = feature.get('annotationType');
            if (annotationType === 'Text' || annotationType === 'Emoji' || annotationType === 'Freehand') {
                return;
            }

            feature.unset('cachedStyle', true);
            const measurementValue = feature.get('measurementValue');
            if (measurementValue) {
                computeAndCacheStyle(feature, measurementValue, measurementConfig);
            }
        });

        if (vectorLayerRef.current) {
            vectorLayerRef.current.changed();
        }
    }, [measurementConfig, sketchFeatureRef, setMeasurements, vectorLayerRef, vectorSourceRef]);
};
