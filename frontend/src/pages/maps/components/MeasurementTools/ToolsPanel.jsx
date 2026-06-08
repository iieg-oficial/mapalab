import { useRef, useState } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { trackMeasurementTool } from '@services/analyticsService';
import HistoryButton from './HistoryButton';
import CloseButton from '@components/CloseButton';
import FloatingIconButton from '@components/FloatingIconButton';
import Icon from '@components/Icon';
import UndoButton from './UndoButton';
import ToolSelector from './ToolSelector';
import EmojiPanel from './EmojiPanel';
import TextInlineEditor from './TextInlineEditor';
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
        areAnnotationToolsVisible,
        setEmojiTemplate,
        hideMeasurementTools,
        hideAnnotationTools,
        restoreLastSelection,
        showSelectionByIndex,
        mapRef,
        selectedFeature,
        selectionTick,
        updateRotation: updateFeatureRotation,
        updateScale: updateFeatureScale,
        updateFillColor: updateFeatureFillColor,
        updateBgColor: updateFeatureBgColor,
        updateStrokeColor: updateFeatureStrokeColor,
        updateStrokeWidth: updateFeatureStrokeWidth,
        deleteSelected: deleteSelectedFeature,
        deselectFeature,
        freehandColor,
        freehandWidth,
        setFreehandColor,
        setFreehandWidth,
        editingText,
        startTextEdit,
        updateEditingTextLabel,
        commitTextEdit,
        cancelTextEdit
    } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isMeasurementListOpen, setIsMeasurementListOpen] = useState(false);
    const [toolsCollapsed, setToolsCollapsed] = useState(false);
    const emojiPickerButtonRef = useRef(null);

    const shouldRender = areMeasurementToolsVisible || areAnnotationToolsVisible || isDrawing || measurements.length > 0;
    const showTypeSwitcher = !toolsCollapsed && (areMeasurementToolsVisible || areAnnotationToolsVisible || isDrawing);

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
        if (measureType === 'Text' && isDrawing) {
            stopDrawing();
            return;
        }
        trackMeasurementTool('Texto');
        startDrawing('Text');
    };

    const handleCloseToolsConfirm = () => {
        cancel?.();
        hideMeasurementTools?.();
        hideAnnotationTools?.();
        setIsEmojiPickerOpen(false);
        setIsMeasurementListOpen(false);
    };

    if (!shouldRender) {
        return null;
    }

    return (
        <div
            className={`fixed z-10 flex flex-col gap-2 items-start min-w-11 ${className}`}
            style={style}
        >
            <div className="flex items-center gap-2">
                <HistoryButton
                    count={measurements.length}
                    onClick={() => setIsMeasurementListOpen(!isMeasurementListOpen)}
                    isOpen={isMeasurementListOpen}
                    tooltip="Mediciones y anotaciones"
                />

                {(showTypeSwitcher || toolsCollapsed) && (areMeasurementToolsVisible || areAnnotationToolsVisible) && (
                    <FloatingIconButton
                        iconKey={toolsCollapsed ? 'left_arrow_fill_normal' : 'right_arrow_fill_normal'}
                        tooltip={toolsCollapsed ? 'Mostrar herramientas' : 'Ocultar herramientas'}
                        placement="left"
                        delay={300}
                        onClick={() => setToolsCollapsed(prev => !prev)}
                    />
                )}

                {isDrawing && (
                    <div className="md:hidden flex items-center gap-0.5 bg-white rounded-full px-1.5 py-0.5 shadow-[0_2px_8px_#1A26641A]">
                        <UndoButton onClick={undoLastPoint} disabled={!isSketching} showLabel={false} />
                        <button type="button" onClick={finishCurrentSketch} className="flex items-center justify-center size-7 rounded-full hover:bg-[#DCFCE7] transition-colors" aria-label="Terminar trazo">
                            <Icon name="done" state="normal" className="size-4 text-[#16A34A]" />
                        </button>
                        <button type="button" onClick={cancelCurrentSketch} className="flex items-center justify-center size-7 rounded-full hover:bg-[#FFE6EC] transition-colors" aria-label="Cancelar trazo">
                            <Icon name="close" state="normal" className="size-4 text-[#FF577D]" />
                        </button>
                    </div>
                )}
            </div>

            <ToolSelector
                visible={showTypeSwitcher || toolsCollapsed}
                compact={toolsCollapsed}
                isDrawing={isDrawing}
                measureType={measureType}
                isEmojiPickerOpen={isEmojiPickerOpen}
                onSelect={handleMeasureTypeClick}
                onTextToggle={handleTextButton}
                onEmojiToggle={handleEmojiButton}
                emojiButtonRef={emojiPickerButtonRef}
                onUndo={undoLastPoint}
                onFinish={finishCurrentSketch}
                onCancel={cancelCurrentSketch}
                canUndo={isSketching}
                freehandColor={freehandColor}
                freehandWidth={freehandWidth}
                onFreehandColor={setFreehandColor}
                onFreehandWidth={setFreehandWidth}
                showMeasurements={areMeasurementToolsVisible}
                showAnnotations={areAnnotationToolsVisible}
            />

            <EmojiPanel
                open={isEmojiPickerOpen}
                anchorRef={emojiPickerButtonRef}
                onSelect={handleEmojiSelect}
                onClose={() => setIsEmojiPickerOpen(false)}
                placedCount={measurements.filter(m => m.type === 'Emoji').length}
            />

            <TextInlineEditor
                mapRef={mapRef}
                feature={editingText}
                onChange={updateEditingTextLabel}
                onCommit={commitTextEdit}
                onCancel={cancelTextEdit}
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
                    onFillColor={updateFeatureFillColor}
                    onBgColor={updateFeatureBgColor}
                    onStrokeColor={updateFeatureStrokeColor}
                    onStrokeWidth={updateFeatureStrokeWidth}
                    onEdit={startTextEdit}
                    onDelete={deleteSelectedFeature}
                    onClose={deselectFeature}
                />
            )}

            <CloseButton
                visible={true}
                onConfirm={handleCloseToolsConfirm}
                tooltip="Cerrar herramientas de medición y anotaciones"
                confirmTitle="¿Cerrar herramientas?"
                confirmDescription="Se eliminarán todos los trazos y anotaciones actuales. Esta acción no se puede deshacer."
                confirmText="Sí, cerrar herramientas"
            />
        </div>
    );
};

export default ToolsPanel;
