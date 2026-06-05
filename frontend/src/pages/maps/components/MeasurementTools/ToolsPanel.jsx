import { useEffect, useRef, useState } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { trackMeasurementTool } from '@services/analyticsService';
import HistoryButton from './HistoryButton';
import CloseButton from '@components/CloseButton';
import ToolSelector from './ToolSelector';
import EmojiPanel from './EmojiPanel';
import TextPanel from './TextPanel';
import HistoryPanel from './HistoryPanel';
import FeatureEditToolbar from './FeatureEditToolbar';

const ToolsPanel = () => {
    const {
        isDrawing,
        isSketching,
        measureType,
        startDrawing,
        stopDrawing,
        measurements,
        deleteMeasurement,
        toggleMeasurementVisibility,
        cancel,
        cancelCurrentSketch,
        undoLastPoint,
        finishCurrentSketch,
        areMeasurementToolsVisible,
        textTemplate,
        setEmojiTemplate,
        setTextTemplate,
        setTextFillColor,
        setTextBgColor,
        setTextSize,
        hideMeasurementTools,
        restoreLastSelection,
        showSelectionByIndex,
        mapRef,
        selectedFeature,
        selectionTick,
        updateRotation: updateFeatureRotation,
        updateScale: updateFeatureScale,
        deleteSelected: deleteSelectedFeature,
        deselectFeature
    } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isTextPanelOpen, setIsTextPanelOpen] = useState(false);
    const [textDraft, setTextDraft] = useState(textTemplate || '');
    const [textColor, setTextColor] = useState('#111827');
    const [textBg, setTextBg] = useState('');
    const [textSz, setTextSz] = useState(1);
    const [isMeasurementListOpen, setIsMeasurementListOpen] = useState(false);
    const [showAdvancedTools, setShowAdvancedTools] = useState(true);
    const emojiPickerButtonRef = useRef(null);
    const textPanelButtonRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setShowAdvancedTools(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const shouldRender = areMeasurementToolsVisible || isDrawing || measurements.length > 0;
    const showTypeSwitcher = areMeasurementToolsVisible || isDrawing;

    const TOOL_LABELS = { LineString: 'Linea', Polygon: 'Poligono', Freehand: 'ManoAlzada', Select: 'Seleccion', Circle: 'Circulo' };

    const handleMeasureTypeClick = (typeId) => {
        if (typeId === 'Point') {
            stopDrawing();
            return;
        }

        if (measureType === typeId && isDrawing) {
            if (typeId === 'Select' && restoreLastSelection) {
                restoreLastSelection();
            }
            stopDrawing();
            return;
        }

        trackMeasurementTool(TOOL_LABELS[typeId] || typeId);
        startDrawing(typeId);
    };

    useEffect(() => {
        setTextDraft(textTemplate || '');
    }, [textTemplate]);

    const handleEmojiButton = () => {
        setIsEmojiPickerOpen((prev) => !prev);
    };

    const handleEmojiSelect = (symbol) => {
        if (setEmojiTemplate) {
            setEmojiTemplate(symbol);
        }
        setIsEmojiPickerOpen(false);
        trackMeasurementTool('Emoji');
        startDrawing('Emoji');
    };

    const handleTextButton = () => {
        setIsTextPanelOpen((prev) => !prev);
    };

    const handleSaveText = () => {
        const value = textDraft.trim();
        if (!value) return;
        setTextTemplate(value);
        setIsTextPanelOpen(false);
        trackMeasurementTool('Texto');
        startDrawing('Text');
    };

    const handleCloseToolsConfirm = () => {
        cancel?.();
        hideMeasurementTools?.();
        setIsEmojiPickerOpen(false);
        setIsTextPanelOpen(false);
        setIsMeasurementListOpen(false);
    };

    if (!shouldRender) {
        return null;
    }

    return (
        <div
            className={`fixed z-10 flex flex-col gap-2 items-start min-w-[44px] ${className}`}
            style={style}
        >
            <HistoryButton
                count={measurements.length}
                onClick={() => setIsMeasurementListOpen(!isMeasurementListOpen)}
                isOpen={isMeasurementListOpen}
            />

            <ToolSelector
                visible={showTypeSwitcher}
                isDrawing={isDrawing}
                measureType={measureType}
                isTextPanelOpen={isTextPanelOpen}
                isEmojiPickerOpen={isEmojiPickerOpen}
                onSelect={handleMeasureTypeClick}
                onTextToggle={handleTextButton}
                onEmojiToggle={handleEmojiButton}
                textButtonRef={textPanelButtonRef}
                emojiButtonRef={emojiPickerButtonRef}
                onUndo={undoLastPoint}
                onFinish={finishCurrentSketch}
                onCancel={cancelCurrentSketch}
                canUndo={isSketching}
                showAdvancedTools={showAdvancedTools}
                onToggleAdvanced={() => setShowAdvancedTools(prev => !prev)}
            />

            <EmojiPanel
                open={isEmojiPickerOpen}
                anchorRef={emojiPickerButtonRef}
                onSelect={handleEmojiSelect}
                onClose={() => setIsEmojiPickerOpen(false)}
                placedCount={measurements.filter(m => m.type === 'Emoji').length}
            />

            <TextPanel
                open={isTextPanelOpen}
                anchorRef={textPanelButtonRef}
                value={textDraft}
                onChange={setTextDraft}
                fillColor={textColor}
                onFillColorChange={(c) => { setTextColor(c); setTextFillColor?.(c); }}
                bgColor={textBg}
                onBgColorChange={(c) => { setTextBg(c); setTextBgColor?.(c); }}
                size={textSz}
                onSizeChange={(s) => { setTextSz(s); setTextSize?.(s); }}
                onSave={handleSaveText}
                onClose={() => setIsTextPanelOpen(false)}
                placedCount={measurements.filter(m => m.type === 'Text').length}
            />

            <HistoryPanel
                open={isMeasurementListOpen}
                measurements={measurements}
                onDelete={deleteMeasurement}
                onToggleVisibility={toggleMeasurementVisibility}
                onClose={() => setIsMeasurementListOpen(false)}
                onShowSelection={showSelectionByIndex}
            />

            {selectedFeature && (
                <FeatureEditToolbar
                    mapRef={mapRef}
                    feature={selectedFeature}
                    selectionTick={selectionTick}
                    onRotate={updateFeatureRotation}
                    onScale={updateFeatureScale}
                    onDelete={deleteSelectedFeature}
                    onClose={deselectFeature}
                />
            )}

            <CloseButton
                visible={isDrawing || areMeasurementToolsVisible}
                onConfirm={handleCloseToolsConfirm}
                tooltip="Cerrar herramienta de mediciones"
                confirmTitle="¿Cerrar herramientas de medición?"
                confirmDescription="Se eliminarán todos los trazos y anotaciones actuales. Esta acción no se puede deshacer."
                confirmText="Sí, cerrar herramientas"
            />
        </div>
    );
};

export default ToolsPanel;
