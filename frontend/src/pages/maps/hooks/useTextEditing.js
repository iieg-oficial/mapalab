import { useCallback, useRef, useState } from 'react';

export const useTextEditing = ({
    mapRef,
    drawInteractionRef,
    vectorSourceRef,
    vectorLayerRef,
    setMeasurements,
    measureTypeRef,
    startDrawingRef,
    stopDrawingRef,
    oneShotRef
}) => {
    const [editingText, setEditingTextState] = useState(null);
    const editingTextRef = useRef(null);
    const editOriginalRef = useRef(null);

    const beginTextEdit = useCallback((feature, originalLabel) => {
        editingTextRef.current = feature;
        editOriginalRef.current = originalLabel;
        setEditingTextState(feature);
        setTimeout(() => {
            if (drawInteractionRef.current && mapRef.current) {
                mapRef.current.removeInteraction(drawInteractionRef.current);
                drawInteractionRef.current = null;
            }
        }, 0);
    }, [mapRef, drawInteractionRef]);

    const updateEditingTextLabel = useCallback((value) => {
        const feature = editingTextRef.current;
        if (feature) feature.set('textLabel', value);
    }, []);

    const finalizeTextEdit = useCallback((textLabel, removeFeature) => {
        const feature = editingTextRef.current;
        if (!feature) return;
        if (removeFeature) {
            if (vectorSourceRef.current) vectorSourceRef.current.removeFeature(feature);
            setMeasurements(prev => prev.filter(m => m.feature !== feature));
        } else {
            feature.set('textLabel', textLabel);
            feature.unset('editing', true);
            feature.unset('cachedStyle', true);
            vectorLayerRef.current?.changed();
            setMeasurements(prev => prev.map(m => (
                m.feature === feature ? { ...m, label: `Texto: ${textLabel}`, value: textLabel } : m
            )));
        }
        editingTextRef.current = null;
        editOriginalRef.current = null;
        setEditingTextState(null);
        if (oneShotRef?.current) {
            stopDrawingRef.current?.();
        } else if (measureTypeRef.current === 'Text' && mapRef.current) {
            startDrawingRef.current?.('Text');
        }
    }, [mapRef, vectorSourceRef, vectorLayerRef, setMeasurements, measureTypeRef, startDrawingRef, stopDrawingRef, oneShotRef]);

    const commitTextEdit = useCallback((rawValue) => {
        const feature = editingTextRef.current;
        if (!feature) return;
        const text = (rawValue ?? feature.get('textLabel') ?? '').trim();
        finalizeTextEdit(text, !text);
    }, [finalizeTextEdit]);

    const cancelTextEdit = useCallback(() => {
        const original = editOriginalRef.current;
        finalizeTextEdit(original ?? '', original == null);
    }, [finalizeTextEdit]);

    const startTextEdit = useCallback((feature) => {
        if (!feature || feature.get('annotationType') !== 'Text') return;
        feature.set('editing', true, true);
        feature.unset('cachedStyle', true);
        vectorLayerRef.current?.changed();
        beginTextEdit(feature, feature.get('textLabel') || '');
    }, [beginTextEdit, vectorLayerRef]);

    const clearTextEditing = useCallback(() => {
        editingTextRef.current = null;
        editOriginalRef.current = null;
        setEditingTextState(null);
    }, []);

    return {
        editingText,
        beginTextEdit,
        updateEditingTextLabel,
        commitTextEdit,
        cancelTextEdit,
        startTextEdit,
        clearTextEditing
    };
};
