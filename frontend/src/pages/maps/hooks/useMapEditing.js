import { useCallback, useEffect, useRef, useState } from 'react';
import { Collection } from 'ol';
import Translate from 'ol/interaction/Translate';

const EDITABLE_TYPES = new Set(['Emoji', 'Text']);

const getFeatureId = (feature) => feature.getId?.() ?? feature.ol_uid;

const invalidateStyle = (feature, layerRef) => {
    feature.unset('cachedStyle', true);
    layerRef?.current?.changed();
};

export const useMapEditing = ({
    mapRef,
    vectorSourceRef,
    vectorLayerRef,
    measurements,
    setMeasurements,
    isDrawing,
    measureType,
    lastPlacedAnnotation
}) => {
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    const [selectionTick, setSelectionTick] = useState(0);
    const selectedCollectionRef = useRef(new Collection());
    const translateRef = useRef(null);
    const selectedFeatureRef = useRef(null);
    const editingClickedRef = useRef(false);

    const findFeatureById = useCallback((id) => {
        if (!vectorSourceRef?.current || id == null) return null;
        return vectorSourceRef.current.getFeatures().find(f => getFeatureId(f) === id) || null;
    }, [vectorSourceRef]);

    const deselectFeature = useCallback(() => {
        const current = selectedFeatureRef.current;
        if (current) {
            current.set('selected', false);
            invalidateStyle(current, vectorLayerRef);
        }
        selectedCollectionRef.current.clear();
        selectedFeatureRef.current = null;
        setSelectedFeatureId(null);
    }, [vectorLayerRef]);

    const selectFeature = useCallback((feature) => {
        if (!feature) return;
        const annotationType = feature.get('annotationType');
        if (!EDITABLE_TYPES.has(annotationType)) return;

        const previous = selectedFeatureRef.current;
        if (previous && previous !== feature) {
            previous.set('selected', false);
            invalidateStyle(previous, vectorLayerRef);
        }

        feature.set('selected', true);
        invalidateStyle(feature, vectorLayerRef);

        selectedCollectionRef.current.clear();
        selectedCollectionRef.current.push(feature);
        selectedFeatureRef.current = feature;
        setSelectedFeatureId(getFeatureId(feature));
        setSelectionTick(t => t + 1);
    }, [vectorLayerRef]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map) return;

        const handleClick = (evt) => {
            editingClickedRef.current = false;
            if (isDrawing) return;

            let hit = null;
            map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                if (hit) return;
                if (EDITABLE_TYPES.has(feature.get('annotationType'))) {
                    hit = feature;
                }
            }, { hitTolerance: 10 });

            if (hit) {
                selectFeature(hit);
                editingClickedRef.current = true;
            } else if (selectedFeatureRef.current) {
                deselectFeature();
                editingClickedRef.current = true;
            }
        };

        map.on('click', handleClick);
        return () => map.un('click', handleClick);
    }, [mapRef, isDrawing, selectFeature, deselectFeature]);

    useEffect(() => {
        if (!selectedFeatureId) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') deselectFeature();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [selectedFeatureId, deselectFeature]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map) return;

        if (selectedFeatureId && !translateRef.current) {
            const translate = new Translate({ features: selectedCollectionRef.current });
            translate.on('translateend', () => {
                setSelectionTick(t => t + 1);
            });
            map.addInteraction(translate);
            translateRef.current = translate;
        } else if (!selectedFeatureId && translateRef.current) {
            map.removeInteraction(translateRef.current);
            translateRef.current = null;
        }

        return () => {
            if (translateRef.current && map) {
                map.removeInteraction(translateRef.current);
                translateRef.current = null;
            }
        };
    }, [selectedFeatureId, mapRef]);

    useEffect(() => {
        if (!selectedFeatureId) return;
        const isAnnotationMode = measureType === 'Emoji' || measureType === 'Text';
        const isGeometryDraw = isDrawing && !isAnnotationMode;
        if (isGeometryDraw) {
            deselectFeature();
        }
    }, [isDrawing, measureType, selectedFeatureId, deselectFeature]);

    useEffect(() => {
        if (!lastPlacedAnnotation?.feature) return;
        selectFeature(lastPlacedAnnotation.feature);
    }, [lastPlacedAnnotation, selectFeature]);

    const updateRotation = useCallback((rotationRad) => {
        const feature = selectedFeatureRef.current;
        if (!feature) return;
        feature.set('rotation', rotationRad);
        invalidateStyle(feature, vectorLayerRef);
        setSelectionTick(t => t + 1);
    }, [vectorLayerRef]);

    const updateScale = useCallback((scale) => {
        const feature = selectedFeatureRef.current;
        if (!feature) return;
        feature.set('scale', scale);
        invalidateStyle(feature, vectorLayerRef);
        setSelectionTick(t => t + 1);
    }, [vectorLayerRef]);

    const deleteSelected = useCallback(() => {
        const feature = selectedFeatureRef.current;
        if (!feature) return;
        const id = getFeatureId(feature);

        if (vectorSourceRef?.current) {
            vectorSourceRef.current.removeFeature(feature);
        }
        setMeasurements?.(prev => prev.filter(m => m.feature !== feature && getFeatureId(m.feature || {}) !== id));
        deselectFeature();
    }, [vectorSourceRef, setMeasurements, deselectFeature]);

    const selectedFeature = selectedFeatureId ? findFeatureById(selectedFeatureId) : null;
    const selectedMeasurement = selectedFeature
        ? measurements.find(m => m.feature === selectedFeature)
        : null;

    return {
        selectedFeatureId,
        selectedFeature,
        selectedMeasurement,
        selectionTick,
        editingClickedRef,
        selectFeature,
        deselectFeature,
        updateRotation,
        updateScale,
        deleteSelected
    };
};
