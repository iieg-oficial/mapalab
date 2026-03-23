import { useEffect, useRef, useState } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { trackDrawingTool } from '@services/analyticsService';
import HistoryButton from './HistoryButton';
import CloseButton from './CloseButton';
import ToolSelector from './ToolSelector';
import EmojiPanel from './EmojiPanel';
import TextPanel from './TextPanel';
import HistoryPanel from './HistoryPanel';

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
        undoLastPoint,
        finishCurrentSketch,
        areMeasurementToolsVisible,
        textTemplate,
        setEmojiTemplate,
        setTextTemplate,
        rotation,
        setRotation,
        hideMeasurementTools,
        restoreLastSelection,
        showSelectionByIndex
    } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isTextPanelOpen, setIsTextPanelOpen] = useState(false);
    const [textDraft, setTextDraft] = useState(textTemplate || '');
    const [isMeasurementListOpen, setIsMeasurementListOpen] = useState(false);
    const [showAdvancedTools, setShowAdvancedTools] = useState(false);
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

        trackDrawingTool(TOOL_LABELS[typeId] || typeId);
        startDrawing(typeId);
    };

    useEffect(() => {
        setTextDraft(textTemplate || '');
    }, [textTemplate]);

    const handleEmojiButton = () => {
        setIsEmojiPickerOpen((prev) => !prev);
    };

    const handleEmojiSelect = (emoji) => {
        if (setEmojiTemplate) {
            setEmojiTemplate(emoji);
        }
        setIsEmojiPickerOpen(false);
        trackDrawingTool('Emoji');
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
        trackDrawingTool('Texto');
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
                canUndo={isSketching}
                showAdvancedTools={showAdvancedTools}
                onToggleAdvanced={() => setShowAdvancedTools(prev => !prev)}
            />

            <EmojiPanel
                open={isEmojiPickerOpen}
                anchorRef={emojiPickerButtonRef}
                onSelect={handleEmojiSelect}
                onClose={() => setIsEmojiPickerOpen(false)}
                rotation={rotation}
                onRotationChange={setRotation}
            />

            <TextPanel
                open={isTextPanelOpen}
                anchorRef={textPanelButtonRef}
                value={textDraft}
                onChange={setTextDraft}
                onSave={handleSaveText}
                onClose={() => setIsTextPanelOpen(false)}
                rotation={rotation}
                onRotationChange={setRotation}
            />

            <HistoryPanel
                open={isMeasurementListOpen}
                measurements={measurements}
                onDelete={deleteMeasurement}
                onToggleVisibility={toggleMeasurementVisibility}
                onClose={() => setIsMeasurementListOpen(false)}
                onShowSelection={showSelectionByIndex}
            />

            <CloseButton
                visible={isDrawing || areMeasurementToolsVisible}
                onConfirm={handleCloseToolsConfirm}
            />
        </div>
    );
};

export default ToolsPanel;
