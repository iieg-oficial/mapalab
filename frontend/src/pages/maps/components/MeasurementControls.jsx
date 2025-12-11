import { useEffect, useRef, useState } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import MeasurementListButton from './MeasurementListButton';
import MeasurementCloseButton from './MeasurementCloseButton';
import MeasurementSwitch from './MeasurementSwitch';
import EmojiPanel from './EmojiPanel';
import TextPanel from './TextPanel';
import MeasurementListPanel from './MeasurementListPanel';
import MeasurementConfigPanel from './MeasurementConfigPanel';
import ConfirmModal from '@components/ConfirmModal';

const MeasurementControls = () => {
    const {
        isDrawing,
        isSketching,
        measureType,
        startDrawing,
        stopDrawing,
        measurements,
        clearDrawings,
        deleteMeasurement,
        toggleMeasurementVisibility,
        cancel,
        undoLastPoint,
        areMeasurementToolsVisible,
        textTemplate,
        setEmojiTemplate,
        setTextTemplate,
        rotation,
        setRotation,
        measurementConfig,
        setMeasurementConfig,
        hideMeasurementTools,
        restoreLastSelection,
        showSelectionByIndex
    } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const containerRef = useRef(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const emojiPickerButtonRef = useRef(null);
    const textPanelButtonRef = useRef(null);
    const [isTextPanelOpen, setIsTextPanelOpen] = useState(false);
    const [textDraft, setTextDraft] = useState(textTemplate || '');
    const [isMeasurementListOpen, setIsMeasurementListOpen] = useState(false);
    const measurementListButtonRef = useRef(null);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const configPanelButtonRef = useRef(null);
    const [isCloseToolsPanelOpen, setIsCloseToolsPanelOpen] = useState(false);
    const closeToolsButtonRef = useRef(null);

    const shouldRender = areMeasurementToolsVisible || isDrawing || measurements.length > 0;
    const showTypeSwitcher = areMeasurementToolsVisible || isDrawing;

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
        startDrawing('Text');
    };

    const handleCloseToolsConfirm = () => {
        cancel?.();
        hideMeasurementTools?.();
        setIsCloseToolsPanelOpen(false);
        setIsEmojiPickerOpen(false);
        setIsTextPanelOpen(false);
        setIsMeasurementListOpen(false);
        setIsConfigPanelOpen(false);
    };

    if (!shouldRender) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`fixed z-10 flex flex-col gap-2 items-start min-w-[44px] ${className}`}
            style={style}
        >
            <MeasurementListButton
                count={measurements.length}
                onClick={() => setIsMeasurementListOpen(!isMeasurementListOpen)}
                buttonRef={measurementListButtonRef}
            />

            {showTypeSwitcher && (
                <MeasurementSwitch
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
                    canUndo={isSketching}
                    measurementConfig={measurementConfig}
                />
            )}

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

            <MeasurementListPanel
                open={isMeasurementListOpen}
                anchorRef={measurementListButtonRef}
                measurements={measurements}
                onDelete={deleteMeasurement}
                onToggleVisibility={toggleMeasurementVisibility}
                onClearAll={clearDrawings}
                onClose={() => setIsMeasurementListOpen(false)}
                onShowSelection={showSelectionByIndex}
            />

            <MeasurementConfigPanel
                open={isConfigPanelOpen}
                anchorRef={configPanelButtonRef}
                config={measurementConfig}
                onConfigChange={setMeasurementConfig}
                onClose={() => setIsConfigPanelOpen(false)}
            />

            <ConfirmModal
                open={isCloseToolsPanelOpen}
                anchorRef={closeToolsButtonRef}
                onClose={() => setIsCloseToolsPanelOpen(false)}
                onConfirm={handleCloseToolsConfirm}
                title="Cerrar herramienta de mediciones"
                confirmText="Cerrar herramienta"
            >
                <p>
                    Al cerrar la herramienta de mediciones se eliminarán todos los trazos y anotaciones actuales.
                </p>
                <p className="text-xs text-gray-500 ">
                    Esta acción no se puede deshacer.
                </p>
            </ConfirmModal>

            {(isDrawing || areMeasurementToolsVisible) && (
                <Tooltip content="Configuración de medición" placement="right" delay={500}>
                    <button
                        ref={configPanelButtonRef}
                        type="button"
                        onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
                        className="w-full bg-white/80  backdrop-blur-sm hover:bg-zinc-100/80  rounded-xl shadow px-3 py-2 transition-colors text-zinc-700 "
                        aria-label="Configuración de medición"
                    >
                        <Icon name="settings" />
                    </button>
                </Tooltip>
            )}

            {(isDrawing || areMeasurementToolsVisible) && (
                <MeasurementCloseButton
                    buttonRef={closeToolsButtonRef}
                    onClick={() => setIsCloseToolsPanelOpen(true)}
                />
            )}
        </div>
    );
};

export default MeasurementControls;
