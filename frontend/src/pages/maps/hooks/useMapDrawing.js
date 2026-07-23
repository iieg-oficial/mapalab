import { useEffect, useRef, useState, useCallback } from 'react';
import { Draw } from 'ol/interaction';
import { getLength } from 'ol/sphere';
import { createFreehandStyle, createSymbolStyle, computeAndCacheStyle, computeStylesForFeature } from '../helpers/drawingStyles';
import { useDrawingStyle } from './useDrawingStyle';
import { buildRestoredItems } from '../helpers/restoreAnnotations';
import { genId } from '../helpers/genId';
import { useAnnotationsPersistence } from './useAnnotationsPersistence';
import { useEmojiTemplate } from './useEmojiTemplate';
import { useTextTemplate } from './useTextTemplate';
import { useFreehandStyle } from './useFreehandStyle';
import { useTextEditing } from './useTextEditing';
import { useVectorLayerSetup } from './useVectorLayerSetup';
import { useIsMobile } from '@hooks/useIsMobile';
import { formatLength, formatArea, formatLengthValue } from '../helpers/formatMeasure';
import { useMeasurementRecalc } from './useMeasurementRecalc';

export const useMapDrawing = (mapRef, onPolygonComplete = null, onShowCachedSelection = null, { storageKey } = {}) => {
    const [measureType, setMeasureType] = useState('Point');
    const [measurements, setMeasurements] = useState([]);
    const [isSketching, setIsSketching] = useState(false);
    const [areMeasurementToolsVisible, setMeasurementToolsVisible] = useState(false);
    const [areAnnotationToolsVisible, setAnnotationToolsVisible] = useState(false);
    const [lastPlacedAnnotation, setLastPlacedAnnotation] = useState(null);
    const { textTemplate, setTextTemplate, textTemplateRef, textFillColorRef, textBgColorRef, textSizeRef, setTextFillColor, setTextBgColor, setTextSize } = useTextTemplate('');
    const [rotation, setRotation] = useState(0);
    const rotationRef = useRef(0);
    const { freehandColor, freehandWidth, freehandColorRef, freehandWidthRef, setFreehandColor, setFreehandWidth } = useFreehandStyle();
    const { emojiTemplate, setEmojiTemplate, emojiTemplateRef } = useEmojiTemplate('');
    const [measurementConfig, setMeasurementConfig] = useState(() => {
        let stored = null;
        try { stored = JSON.parse(localStorage.getItem('mapalab.measure.units')); } catch { /* noop */ }
        return {
            showLiveAngles: false,
            showFinalAngles: true,
            showMeasurementLabels: true,
            enableAnnotationTools: false,
            showSegmentLengths: false,
            lengthUnit: stored?.lengthUnit || 'auto',
            areaUnit: stored?.areaUnit || 'auto'
        };
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
    const showAnnotationTools = useCallback(() => setAnnotationToolsVisible(true), []);
    const hideMeasurementTools = useCallback(() => setMeasurementToolsVisible(false), []);
    const hideAnnotationTools = useCallback(() => setAnnotationToolsVisible(false), []);
    const toggleMeasurementTools = useCallback(() => {
        setMeasurementToolsVisible(prev => !prev);
    }, []);

    useEffect(() => {
        rotationRef.current = rotation;
    }, [rotation]);

    useMeasurementRecalc({ vectorSourceRef, vectorLayerRef, sketchFeatureRef, measurementConfig, setMeasurements });

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

    const getStyleForType = useDrawingStyle(sketchFeatureRef, measurementConfig);

    const { ensureVectorLayer } = useVectorLayerSetup(mapRef, getStyleForType, vectorSourceRef, vectorLayerRef);

    useEffect(() => {
        try {
            localStorage.setItem('mapalab.measure.units', JSON.stringify({
                lengthUnit: measurementConfig.lengthUnit,
                areaUnit: measurementConfig.areaUnit
            }));
        } catch { /* noop */ }
    }, [measurementConfig.lengthUnit, measurementConfig.areaUnit]);

    const measureTypeRef = useRef('Point');
    useEffect(() => {
        measureTypeRef.current = measureType;
    }, [measureType]);

    const isMobile = useIsMobile();
    const oneShotRef = useRef(isMobile);
    oneShotRef.current = isMobile;
    const startDrawingRef = useRef(null);
    const stopDrawingRef = useRef(null);
    const textEditing = useTextEditing({
        mapRef,
        drawInteractionRef,
        vectorSourceRef,
        vectorLayerRef,
        setMeasurements,
        measureTypeRef,
        startDrawingRef,
        stopDrawingRef,
        oneShotRef
    });

    const startDrawing = useCallback((type) => {
        if (!mapRef.current) return;
        if (!vectorSourceRef.current && !ensureVectorLayer()) return;

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

        if (type === 'Text' || type === 'Emoji' || type === 'Freehand') {
            showAnnotationTools();
        } else if (type !== 'Select') {
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
            if (type === 'Freehand') {
                event.feature.set('strokeColor', freehandColorRef.current);
                event.feature.set('strokeWidth', freehandWidthRef.current);
            }
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
                    id: genId(),
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
                if (oneShotRef.current) setTimeout(() => stopDrawingRef.current?.(), 0);
                return;
            }

            let measurementData = {
                id: genId(),
                type: type,
                feature: feature,
                visible: true
            };

            if (type === 'LineString') {
                const length = formatLength(geometry, measurementConfig.lengthUnit);
                measurementData.value = length;
                measurementData.label = `Distancia: ${length}`;
                feature.set('measurementValue', length);
                computeAndCacheStyle(feature, length, measurementConfig);
            } else if (type === 'Polygon') {
                const area = formatArea(geometry, measurementConfig.areaUnit);
                const perimeter = getLength(geometry);
                const perimeterText = formatLengthValue(perimeter, measurementConfig.lengthUnit);
                measurementData.value = area;
                measurementData.label = `Área: ${area}\nPerímetro: ${perimeterText}`;
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
                const style = createFreehandStyle(feature.get('strokeColor'), feature.get('strokeWidth'));
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
                measurementData.value = '';
                measurementData.label = 'Texto';
                feature.set('editing', true, true);
                feature.unset('cachedStyle', true);
                textEditing.beginTextEdit(feature, null);
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
            if (oneShotRef.current && type !== 'Text') setTimeout(() => stopDrawingRef.current?.(), 0);
        });

        mapRef.current.addInteraction(draw);
        drawInteractionRef.current = draw;
        setMeasureType(type);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapRef, getStyleForType, updateSketchingState, showMeasurementTools, ensureVectorLayer]);

    startDrawingRef.current = startDrawing;

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

    stopDrawingRef.current = stopDrawing;

    useEffect(() => {
        const map = mapRef.current;
        const el = map?.getTargetElement?.();
        if (!el) return;
        const drawing = measureType !== 'Point' && measureType !== null;
        el.style.cursor = drawing ? (measureType === 'Text' ? 'text' : 'crosshair') : '';
        return () => { el.style.cursor = ''; };
    }, [mapRef, measureType]);

    useEffect(() => {
        const isDrawing = measureType !== 'Point' && measureType !== null;
        if (!isDrawing || !drawInteractionRef.current) return;

        const handleKeyDown = (e) => {
            if (e.key !== 'Escape' || !drawInteractionRef.current) {
                return;
            }

            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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
                if (oneShotRef.current) stopDrawing();
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
                if (oneShotRef.current) stopDrawing();
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
        textEditing.clearTextEditing();
    }, [textEditing]);

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
        if (oneShotRef.current) stopDrawing();
    }, [updateSketchingState, stopDrawing]);

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

    const restoreAnnotations = useCallback((annotations, { showTools = true } = {}) => {
        if (!annotations?.length) return;
        let attempts = 0;
        const tryApply = () => {
            if (mapRef.current && ensureVectorLayer() && vectorSourceRef.current) {
                const restored = buildRestoredItems({ annotations, source: vectorSourceRef.current, measurementConfig });
                if (restored.length) {
                    setMeasurements(prev => [...prev, ...restored]);
                    if (showTools) setMeasurementToolsVisible(true);
                }
            } else if (attempts++ < 50) setTimeout(tryApply, 100);
        };
        tryApply();
    }, [mapRef, ensureVectorLayer, measurementConfig]);

    useAnnotationsPersistence({ measurements, restoreAnnotations, storageKey });

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
        freehandColor,
        freehandWidth,
        setFreehandColor,
        setFreehandWidth,
        rotation,
        setRotation,
        measurementConfig,
        setMeasurementConfig,
        finishCurrentSketch,
        restoreLastSelection,
        showSelectionByIndex,
        updateSelectionCount,
        editingText: textEditing.editingText,
        startTextEdit: textEditing.startTextEdit,
        updateEditingTextLabel: textEditing.updateEditingTextLabel,
        commitTextEdit: textEditing.commitTextEdit,
        cancelTextEdit: textEditing.cancelTextEdit
    };
};
