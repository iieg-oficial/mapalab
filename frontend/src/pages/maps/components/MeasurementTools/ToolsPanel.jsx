import { useRef, useState } from 'react';
import { useSiderAdaptivePosition, useSider } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { trackMeasurementTool } from '@services/analyticsService';
import HistoryButton from './HistoryButton';
import CloseButton from '@components/CloseButton';
import ToolSelector from './ToolSelector';
import EmojiPanel from './EmojiPanel';
import TextInlineEditor from './TextInlineEditor';
import HistoryPanel from './HistoryPanel';
import FeatureEditToolbar from './FeatureEditToolbar';
import { abrirInfoBoxDeMedicion, useInfoBoxDeMedicion } from '@hooksMaps/useInfoBoxDeMedicion';

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
        showSelection,
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
        clearDrawings,
        deselectFeature,
        freehandColor,
        freehandWidth,
        setFreehandColor,
        setFreehandWidth,
        editingText,
        startTextEdit,
        updateEditingTextLabel,
        commitTextEdit,
        cancelTextEdit,
        updatePin,
        setSelectedFeatureInfo,
        clickPosition
    } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const { isMobile } = useSider();
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isMeasurementListOpen, setIsMeasurementListOpen] = useState(false);
    const emojiPickerButtonRef = useRef(null);
    useInfoBoxDeMedicion({ measurements, mapRef, setSelectedFeatureInfo, clickPosition });

    const mostrarMedicion = (id) => abrirInfoBoxDeMedicion({
        medicion: measurements.find(m => m.id === id),
        setSelectedFeatureInfo,
        clickPosition,
    });

    const shouldRender = areMeasurementToolsVisible || areAnnotationToolsVisible || isDrawing || measurements.length > 0;
    const showTypeSwitcher = areMeasurementToolsVisible || areAnnotationToolsVisible || isDrawing;
    const compact = isMobile && (isDrawing || isEmojiPickerOpen || !!editingText);

    const TOOL_LABELS = { LineString: 'Linea', Polygon: 'Poligono', Freehand: 'ManoAlzada', Select: 'Seleccion', Circle: 'Circulo', Pin: 'Pin' };

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
            </div>

            <ToolSelector
                visible={showTypeSwitcher}
                compact={compact}
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
                onShowSelection={showSelection}
                onShowMeasurement={mostrarMedicion}
                onClearAll={clearDrawings}
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
                    onPin={updatePin}
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
