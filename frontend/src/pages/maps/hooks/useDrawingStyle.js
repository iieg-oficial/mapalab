import { useCallback } from 'react';
import { createDefaultStyle, createFreehandStyle, createSymbolStyle, createTextStyle, computeAndCacheStyle, computeStylesForFeature } from '../helpers/drawingStyles';

export const useDrawingStyle = (sketchFeatureRef, measurementConfig) => {
    return useCallback((feature) => {
        const isSketch = feature === sketchFeatureRef.current;

        if (!isSketch && feature.get('visible') === false) {
            return null;
        }

        const cachedStyle = feature.get('cachedStyle');

        if (cachedStyle && !isSketch) {
            return cachedStyle;
        }

        const annotationType = feature.get('annotationType');
        const geometry = feature.getGeometry();
        const geometryType = geometry?.getType();
        const featureRotation = feature.get('rotation') || 0;
        const featureScale = feature.get('scale') || 1;
        const featureSelected = feature.get('selected') === true;

        if (annotationType === 'Emoji') {
            const symbol = feature.get('symbolPayload')
                || { kind: 'emoji', value: feature.get('textLabel') };
            const style = createSymbolStyle(symbol, featureRotation, featureScale, featureSelected);
            if (!isSketch) {
                feature.set('cachedStyle', style, true);
            }
            return style;
        }

        if (annotationType === 'Text') {
            if (feature.get('editing')) return null;
            const fill = feature.get('fillColor') || '#111827';
            const bg = feature.get('bgColor') || '';
            const style = createTextStyle(feature.get('textLabel'), featureRotation, featureScale, featureSelected, fill, bg);
            if (!isSketch) {
                feature.set('cachedStyle', style, true);
            }
            return style;
        }

        if (annotationType === 'Freehand') {
            const strokeColor = feature.get('strokeColor');
            const strokeWidth = feature.get('strokeWidth');
            const style = createFreehandStyle(strokeColor, strokeWidth, featureSelected);
            if (!isSketch) {
                feature.set('cachedStyle', style, true);
            }
            return style;
        }

        if (annotationType === 'Select') {
            const selectStyle = computeStylesForFeature('Select', null, geometry, {
                showMeasurementLabels: false,
                showFinalAngles: false
            });
            if (!isSketch) {
                feature.set('cachedStyle', selectStyle, true);
            }
            return selectStyle;
        }

        if (isSketch && measurementConfig.showLiveAngles && (geometryType === 'LineString' || geometryType === 'Polygon')) {
            const coords = geometryType === 'Polygon' ? geometry.getCoordinates()[0] : geometry.getCoordinates();
            if (coords && coords.length >= 3) {
                const liveConfig = {
                    showMeasurementLabels: false,
                    showFinalAngles: true
                };
                return computeStylesForFeature(geometryType, null, geometry, liveConfig);
            }
        }

        const measurementValue = feature.get('measurementValue');
        if (!isSketch) {
            return computeAndCacheStyle(feature, measurementValue, measurementConfig);
        }

        return createDefaultStyle(geometryType);
    }, [measurementConfig, sketchFeatureRef]);
};
