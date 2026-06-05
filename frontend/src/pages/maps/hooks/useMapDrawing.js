import { useEffect, useRef, useState, useCallback } from 'react';
import { Draw } from 'ol/interaction';
import { getLength, getArea } from 'ol/sphere';
import { createDefaultStyle, createFreehandStyle, createSymbolStyle, createTextStyle, computeAndCacheStyle, computeStylesForFeature } from '../helpers/drawingStyles';
import { formatNumber } from '../helpers/formatNumber';
import { buildRestoredItems } from '../helpers/restoreAnnotations';
import { useEmojiTemplate } from './useEmojiTemplate';
import { useTextTemplate } from './useTextTemplate';
import { useVectorLayerSetup } from './useVectorLayerSetup';

export const useMapDrawing = (mapRef, onPolygonComplete = null, onShowCachedSelection = null) => {
    const [measureType, setMeasureType] = useState('Point');
    const [measurements, setMeasurements] = useState([]);
    const [isSketching, setIsSketching] = useState(false);
    const [areMeasurementToolsVisible, setMeasurementToolsVisible] = useState(false);
    const [areAnnotationToolsVisible, setAnnotationToolsVisible] = useState(false);
    const [lastPlacedAnnotation, setLastPlacedAnnotation] = useState(null);
    const { textTemplate, setTextTemplate, textTemplateRef, textFillColorRef, textBgColorRef, textSizeRef, setTextFillColor, setTextBgColor, setTextSize } = useTextTemplate('');
    const [rotation, setRotation] = useState(0);
    const rotationRef = useRef(0);
    const { emojiTemplate, setEmojiTemplate, emojiTemplateRef } = useEmojiTemplate('');
    const [measurementConfig, setMeasurementConfig] = useState({
        showLiveAngles: false,
        showFinalAngles: true,
        showMeasurementLabels: true,
        enableAnnotationTools: false
    });
    const drawInteractionRef = useRef(null);
    const vectorSourceRef = useRef(null);
    const vectorLayerRef = useRef(null);
    const isSketchingRef = useRef(false);
    const sketchFeatureRef = useRef(null);
    const geometryChangeListenerRef = useRef(null);
    const lastSelectGeometryRef = useRef(null);
    const lastSelectCenterRef = useRef(null);

    const updateSketchingState = useCallback((value) => {
        isSketchingRef.current = value;
        setIsSketching(value);
    }, []);

    const showMeasurementTools = useCallback(() => setMeasurementToolsVisible(true), []);
    const hideMeasurementTools = useCallback(() => setMeasurementToolsVisible(false), []);
    const hideAnnotationTools = useCallback(() => setAnnotationToolsVisible(false), []);
    const toggleMeasurementTools = useCallback(() => {
        setMeasurementToolsVisible(prev => !prev);
    }, []);

    useEffect(() => {
        rotationRef.current = rotation;
    }, [rotation]);

    useEffect(() => {
        if (!vectorSourceRef.current) return;

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
    }, [measurementConfig]);

    useEffect(() => {
        if (!drawInteractionRef.current) return;

        const currentType = measureType;
        if (currentType === 'Point' || currentType === 'Text' || currentType === 'Emoji' || currentType === 'Freehand' || currentType === 'Select') {
            return;
        }

        if (!mapRef.current) return;

        if (drawInteractionRef.current) {
            mapRef.current.removeInteraction(drawInteractionRef.current);
            drawInteractionRef.current = null;
        }

        setTimeout(() => {
            if (!mapRef.current || !currentType) return;

            const drawInteraction = new Draw({
                source: vectorSourceRef.current,
                type: currentType === 'LineString' ? 'LineString' : 'Polygon',
                style: getStyleForType,
            });

            mapRef.current.addInteraction(drawInteraction);
            drawInteractionRef.current = drawInteraction;
        }, 10);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [measurementConfig.showLiveAngles]);

    const getStyleForType = useCallback((feature) => {
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
            const fill = feature.get('fillColor') || '#111827';
            const bg = feature.get('bgColor') || '';
            const style = createTextStyle(feature.get('textLabel'), featureRotation, featureScale, featureSelected, fill, bg);
            if (!isSketch) {
                feature.set('cachedStyle', style, true);
            }
            return style;
        }

        if (annotationType === 'Freehand') {
            const style = createFreehandStyle();
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
    }, [measurementConfig]);

    const { ensureVectorLayer } = useVectorLayerSetup(mapRef, getStyleForType, vectorSourceRef, vectorLayerRef);

    const formatLength = useCallback((line) => {
        const length = getLength(line);
        let output;
        if (length > 1000) {
            output = `${formatNumber(Math.round((length / 1000) * 100) / 100)} km`;
        } else {
            output = `${formatNumber(Math.round(length * 100) / 100)} m`;
        }
        return output;
    }, []);

    const formatArea = useCallback((polygon) => {
        const area = getArea(polygon);
        let output;
        if (area > 10000) {
            output = `${formatNumber(Math.round((area / 1000000) * 100) / 100)} km²`;
        } else {
            output = `${formatNumber(Math.round(area * 100) / 100)} m²`;
        }
        return output;
    }, []);

    const startDrawing = useCallback((type) => {
        if (!mapRef.current) return;
        if (!vectorSourceRef.current && !ensureVectorLayer()) return;

        if (type === 'Text' && !textTemplateRef.current) {
            console.warn('Debes proporcionar un texto antes de colocarlo en el mapa');
            return;
        }

        if (type === 'Emoji' && !emojiTemplateRef.current) {
            console.warn('Debes seleccionar un emoji antes de colocarlo en el mapa');
            return;
        }

        if (type === 'Point') {
            if (drawInteractionRef.current) {
                mapRef.current.removeInteraction(drawInteractionRef.current);
                drawInteractionRef.current = null;
            }
            setMeasureType('Point');
            updateSketchingState(false);
            sketchFeatureRef.current = null;
            return;
        }

        if (type !== 'Select') {
            showMeasurementTools();
        }

        if (drawInteractionRef.current) {
            mapRef.current.removeInteraction(drawInteractionRef.current);
            updateSketchingState(false);
            sketchFeatureRef.current = null;
        }

        const drawOptions = {
            source: vectorSourceRef.current,
            type: type === 'Freehand'
                ? 'LineString'
                : (type === 'Text' || type === 'Emoji' ? 'Point' : (type === 'Select' ? 'Polygon' : type)),
            style: getStyleForType
        };

        if (type === 'Freehand') {
            drawOptions.freehand = true;
        }

        const draw = new Draw(drawOptions);

        draw.on('drawstart', (event) => {
            sketchFeatureRef.current = event.feature;
            event.feature.set('annotationType', type);
            if (type === 'Emoji') {
                const symbol = emojiTemplateRef.current;
                event.feature.set('symbolPayload', symbol);
                event.feature.set('textLabel', symbol?.kind === 'emoji' ? symbol.value : (symbol?.name || ''));
                event.feature.set('rotation', rotationRef.current);
                event.feature.set('scale', 1);
            }
            if (type === 'Text') {
                event.feature.set('textLabel', textTemplateRef.current);
                event.feature.set('rotation', rotationRef.current);
                event.feature.set('scale', textSizeRef.current || 1);
                if (textFillColorRef.current) event.feature.set('fillColor', textFillColorRef.current);
                if (textBgColorRef.current) event.feature.set('bgColor', textBgColorRef.current);
            }
            updateSketchingState(true);

            if (geometryChangeListenerRef.current) {
                const geom = event.feature.getGeometry();
                geom.un('change', geometryChangeListenerRef.current);
                geometryChangeListenerRef.current = null;
            }

            if (measurementConfig.showLiveAngles && (type === 'LineString' || type === 'Polygon')) {
                const geometry = event.feature.getGeometry();
                const listener = () => {
                    event.feature.unset('cachedStyle', true);
                    event.feature.changed();
                };
                geometryChangeListenerRef.current = listener;
                geometry.on('change', listener);
            }
        });

        draw.on('drawend', (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();

            if (geometryChangeListenerRef.current) {
                geometry.un('change', geometryChangeListenerRef.current);
                geometryChangeListenerRef.current = null;
            }

            feature.set('visible', true, true);

            if (type === 'Select') {
                const extent = geometry.getExtent();
                const center = [
                    (extent[0] + extent[2]) / 2,
                    (extent[1] + extent[3]) / 2
                ];

                lastSelectGeometryRef.current = geometry;
                lastSelectCenterRef.current = center;

                const measurementData = {
                    id: crypto.randomUUID(),
                    type: type,
                    feature: feature,
                    visible: true,
                    geometry: geometry,
                    center: center,
                    label: `Consultando...`,
                    value: null
                };

                feature.set('measurementValue', null);
                feature.set('annotationType', 'Select');
                feature.set('selectionGeometry', geometry);
                feature.set('selectionCenter', center);

                const selectStyle = computeStylesForFeature('Select', null, geometry, {
                    showMeasurementLabels: false,
                    showFinalAngles: false
                });
                feature.set('cachedStyle', selectStyle, true);

                setMeasurements(prev => [...prev, measurementData]);

                if (onPolygonComplete && mapRef.current) {
                    onPolygonComplete(geometry, center, updateSelectionCount);
                }

                updateSketchingState(false);
                sketchFeatureRef.current = null;
                return;
            }

            let measurementData = {
                id: crypto.randomUUID(),
                type: type,
                feature: feature,
                visible: true
            };

            if (type === 'LineString') {
                const length = formatLength(geometry);
                measurementData.value = length;
                measurementData.label = `Distancia: ${length}`;
                feature.set('measurementValue', length);
                computeAndCacheStyle(feature, length, measurementConfig);
            } else if (type === 'Polygon') {
                const area = formatArea(geometry);
                measurementData.value = area;
                measurementData.label = `Área: ${area}`;
                feature.set('measurementValue', area);
                computeAndCacheStyle(feature, area, measurementConfig);

                const extent = geometry.getExtent();
                const center = [
                    (extent[0] + extent[2]) / 2,
                    (extent[1] + extent[3]) / 2
                ];

                lastSelectGeometryRef.current = geometry;
                lastSelectCenterRef.current = center;

                feature.set('selectionGeometry', geometry);
                feature.set('selectionCenter', center);

                measurementData.geometry = geometry;
                measurementData.center = center;

                if (onPolygonComplete && mapRef.current) {
                    onPolygonComplete(geometry, center, updateSelectionCount);
                }
            } else if (type === 'Freehand') {
                measurementData.label = 'Trazo libre';
                const style = createFreehandStyle();
                feature.set('cachedStyle', style, true);
            } else if (type === 'Emoji') {
                const symbol = feature.get('symbolPayload') || { kind: 'emoji', value: feature.get('textLabel') || '' };
                const labelText = symbol.kind === 'emoji'
                    ? symbol.value
                    : (symbol.name || symbol.kind);
                measurementData.value = labelText || '';
                measurementData.label = `Emoji: ${labelText || ''}`;
                const rotation = feature.get('rotation') || 0;
                const style = createSymbolStyle(symbol, rotation);
                feature.set('cachedStyle', style, true);
                setLastPlacedAnnotation({ feature, placedAt: Date.now() });
            } else if (type === 'Text') {
                const textValue = feature.get('textLabel') || '';
                measurementData.value = textValue;
                measurementData.label = `Texto: ${textValue || 'Sin contenido'}`;
                const rotation = feature.get('rotation') || 0;
                const style = createTextStyle(textValue, rotation);
                feature.set('cachedStyle', style, true);
                setLastPlacedAnnotation({ feature, placedAt: Date.now() });
            }

            setMeasurements(prev => {
                let nextLabel = measurementData.label;

                if (!nextLabel) {
                    if (type === 'Freehand') {
                        const count = prev.filter(item => item.type === 'Freehand').length + 1;
                        nextLabel = `Trazo libre ${count}`;
                    } else if (type === 'Text') {
                        nextLabel = `Texto: ${measurementData.value || ''}`;
                    } else if (type === 'Emoji') {
                        nextLabel = `Emoji: ${measurementData.value || ''}`;
                    }
                }

                return [...prev, { ...measurementData, label: nextLabel }];
            });
            updateSketchingState(false);
            sketchFeatureRef.current = null;
        });

        mapRef.current.addInteraction(draw);
        drawInteractionRef.current = draw;
        setMeasureType(type);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapRef, formatLength, formatArea, getStyleForType, updateSketchingState, showMeasurementTools, ensureVectorLayer]);

    const stopDrawing = useCallback(() => {
        if (!mapRef.current) return;

        if (drawInteractionRef.current) {
            mapRef.current.removeInteraction(drawInteractionRef.current);
            drawInteractionRef.current = null;
        }

        sketchFeatureRef.current = null;
        updateSketchingState(false);
        setMeasureType('Point');
    }, [mapRef, updateSketchingState]);

    useEffect(() => {
        const isDrawing = measureType !== 'Point' && measureType !== null;
        if (!isDrawing || !drawInteractionRef.current) return;

        const handleKeyDown = (e) => {
            if (e.key !== 'Escape' || !drawInteractionRef.current) {
                return;
            }

            if (!isSketchingRef.current) {
                stopDrawing();
                return;
            }

            e.preventDefault();

            const geometry = sketchFeatureRef.current?.getGeometry?.();
            if (!geometry) {
                drawInteractionRef.current.abortDrawing();
                updateSketchingState(false);
                sketchFeatureRef.current = null;
                return;
            }

            const type = geometry.getType();
            const coordinates = geometry.getCoordinates();
            const minPoints = type === 'Polygon' ? 3 : 2;
            let pointsCount;

            if (type === 'Polygon') {
                pointsCount = Array.isArray(coordinates?.[0]) ? coordinates[0].length : 0;
            } else {
                pointsCount = Array.isArray(coordinates) ? coordinates.length : 0;
            }

            if (pointsCount >= minPoints) {
                drawInteractionRef.current.finishDrawing();
            } else {
                drawInteractionRef.current.abortDrawing();
                updateSketchingState(false);
                sketchFeatureRef.current = null;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [measureType, stopDrawing, updateSketchingState]);

    const finishCurrentSketch = useCallback(() => {
        if (!drawInteractionRef.current || !isSketchingRef.current) return;
        drawInteractionRef.current.finishDrawing();
    }, []);

    const clearDrawings = useCallback(() => {
        if (vectorSourceRef.current) {
            vectorSourceRef.current.clear();
        }
        setMeasurements([]);
    }, []);

    const deleteMeasurement = useCallback((index) => {
        setMeasurements(prev => {
            const newMeasurements = [...prev];
            const removed = newMeasurements.splice(index, 1)[0];
            if (removed?.feature && vectorSourceRef.current) {
                vectorSourceRef.current.removeFeature(removed.feature);
            }
            return newMeasurements;
        });
    }, []);

    const toggleMeasurementVisibility = useCallback((index) => {
        setMeasurements(prev => {
            const newMeasurements = [...prev];
            const measurement = newMeasurements[index];
            if (measurement?.feature) {
                const newVisibility = measurement.visible === false ? true : false;
                measurement.feature.set('visible', newVisibility, true);
                measurement.feature.changed();
                newMeasurements[index] = { ...measurement, visible: newVisibility };
            }
            return newMeasurements;
        });
    }, []);

    const cancel = useCallback(() => {
        stopDrawing();
        clearDrawings();
    }, [stopDrawing, clearDrawings]);

    const cancelCurrentSketch = useCallback(() => {
        if (!drawInteractionRef.current || !isSketchingRef.current) return;
        try {
            drawInteractionRef.current.abortDrawing();
        } catch (error) {
            console.debug('No se pudo cancelar el trazo actual', error);
        }
        updateSketchingState(false);
        sketchFeatureRef.current = null;
    }, [updateSketchingState]);

    const undoLastPoint = useCallback(() => {
        if (
            measureType === 'Point' ||
            measureType === 'Emoji' ||
            measureType === 'Text' ||
            !drawInteractionRef.current ||
            !isSketchingRef.current
        ) {
            return false;
        }

        try {
            drawInteractionRef.current.removeLastPoint();
            return true;
        } catch (error) {
            console.debug('No se pudo deshacer el último punto', error);
            return false;
        }
    }, [measureType]);

    useEffect(() => {
        const mapInstance = mapRef.current;
        if (!mapInstance) return;

        const targetElement = mapInstance.getTargetElement();
        if (!targetElement) return;

        const handleContextMenu = (event) => {
            if (!isSketchingRef.current || measureType === 'Point') {
                return;
            }

            event.preventDefault();
            undoLastPoint();
        };

        targetElement.addEventListener('contextmenu', handleContextMenu);

        return () => {
            targetElement.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [mapRef, measureType, undoLastPoint]);

    const restoreLastSelection = useCallback(() => {
        if (lastSelectGeometryRef.current && lastSelectCenterRef.current && onPolygonComplete && mapRef.current) {
            onPolygonComplete(lastSelectGeometryRef.current, lastSelectCenterRef.current);
        }
    }, [onPolygonComplete, mapRef]);

    const showSelectionByIndex = useCallback((index) => {
        const measurement = measurements[index];
        if (measurement && (measurement.type === 'Select' || measurement.type === 'Polygon') && measurement.geometry && measurement.center) {
            if (measurement.cachedResults && onShowCachedSelection) {
                onShowCachedSelection(measurement.cachedResults, measurement.center);
            } else if (onPolygonComplete && mapRef.current) {
                onPolygonComplete(measurement.geometry, measurement.center, null);
            }
        }
    }, [measurements, onPolygonComplete, onShowCachedSelection, mapRef]);

    const updateSelectionCount = useCallback((featureCount, layerBreakdown = [], results = null) => {
        setMeasurements(prev => {
            const lastIndex = prev.length - 1;
            if (lastIndex >= 0) {
                const lastMeasurement = prev[lastIndex];
                if (lastMeasurement.type === 'Select' || lastMeasurement.type === 'Polygon') {
                    const updated = [...prev];

                    if (lastMeasurement.type === 'Select') {
                        let label = `${featureCount} ${featureCount === 1 ? 'elemento' : 'elementos'}`;

                        if (layerBreakdown.length > 0) {
                            const breakdown = layerBreakdown
                                .map(layer => `${layer.count} de ${layer.name}`)
                                .join(', ');
                            label = `${featureCount} ${featureCount === 1 ? 'elemento' : 'elementos'} (${breakdown})`;
                        }

                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            label,
                            value: featureCount,
                            layerBreakdown,
                            cachedResults: results
                        };
                    } else {
                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            selectionCount: featureCount,
                            layerBreakdown,
                            cachedResults: results
                        };
                    }
                    return updated;
                }
            }
            return prev;
        });
    }, []);

    const restoreAnnotations = useCallback((annotations) => {
        if (!annotations?.length) return;
        let attempts = 0;
        const tryApply = () => {
            if (mapRef.current && ensureVectorLayer() && vectorSourceRef.current) {
                const restored = buildRestoredItems({ annotations, source: vectorSourceRef.current, measurementConfig, formatLength, formatArea });
                if (restored.length) {
                    setMeasurements(prev => [...prev, ...restored]);
                    setMeasurementToolsVisible(true);
                }
            } else if (attempts++ < 50) setTimeout(tryApply, 100);
        };
        tryApply();
    }, [mapRef, ensureVectorLayer, measurementConfig, formatLength, formatArea]);

    return {
        vectorSourceRef,
        vectorLayerRef,
        measureType,
        measurements,
        setMeasurements,
        restoreAnnotations,
        lastPlacedAnnotation,
        startDrawing,
        stopDrawing,
        cancelCurrentSketch,
        clearDrawings,
        deleteMeasurement,
        toggleMeasurementVisibility,
        cancel,
        undoLastPoint,
        isDrawing: measureType !== 'Point' && measureType !== null,
        isSketching,
        areMeasurementToolsVisible,
        showMeasurementTools,
        hideMeasurementTools,
        hideAnnotationTools,
        toggleMeasurementTools,
        areAnnotationToolsVisible,
        toggleAnnotationTools: () => setAnnotationToolsVisible(prev => !prev),
        textTemplate,
        setTextTemplate,
        emojiTemplate,
        setEmojiTemplate,
        setTextFillColor,
        setTextBgColor,
        setTextSize,
        rotation,
        setRotation,
        measurementConfig,
        setMeasurementConfig,
        finishCurrentSketch,
        restoreLastSelection,
        showSelectionByIndex,
        updateSelectionCount
    };
};
