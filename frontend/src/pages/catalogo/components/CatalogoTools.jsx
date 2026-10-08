import { useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useIsMobile } from '@hooks/useIsMobile';
import Tooltip from '@components/Tooltip';
import { trackMeasurementTool, trackCatalogoToolsToggle } from '@services/analyticsService';
import ToolSelector from '@mapsComponents/MeasurementTools/ToolSelector';
import EmojiPanel from '@mapsComponents/MeasurementTools/EmojiPanel';
import TextInlineEditor from '@mapsComponents/MeasurementTools/TextInlineEditor';
import FeatureEditToolbar from '@mapsComponents/MeasurementTools/FeatureEditToolbar';
import HistoryButton from '@mapsComponents/MeasurementTools/HistoryButton';
import HistoryPanel from '@mapsComponents/MeasurementTools/HistoryPanel';
import { abrirInfoBoxDeMedicion, useInfoBoxDeMedicion } from '@hooksMaps/useInfoBoxDeMedicion';
import CatalogoTablaButton from './CatalogoTablaButton';

const TOOL_LABELS = { LineString: 'Linea', Polygon: 'Poligono', Freehand: 'ManoAlzada', Select: 'Seleccion', Circle: 'Circulo', Pin: 'Pin' };

const RulerIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
        <path d="m14.5 12.5 2-2" />
        <path d="m11.5 9.5 2-2" />
        <path d="m8.5 6.5 2-2" />
        <path d="m17.5 15.5 2-2" />
    </svg>
);

const CloseIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const PanelDeLineaNueva = ({ measurements, mapRef, setSelectedFeatureInfo, clickPosition }) => {
    useInfoBoxDeMedicion({ measurements, mapRef, setSelectedFeatureInfo, clickPosition });
    return null;
};

const CatalogoTools = ({ tabla, hayCapa }) => {
    const {
        isDrawing,
        isSketching,
        measureType,
        startDrawing,
        stopDrawing,
        clearDrawings,
        measurements,
        deleteMeasurement,
        toggleMeasurementVisibility,
        cancelCurrentSketch,
        undoLastPoint,
        finishCurrentSketch,
        restoreLastSelection,
        showSelection,
        setEmojiTemplate,
        mapRef,
        selectedFeature,
        selectionTick,
        updateRotation,
        updateScale,
        updateFillColor,
        updateBgColor,
        updateStrokeColor,
        updateStrokeWidth,
        deleteSelected,
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

    const isMobile = useIsMobile();
    const [toolsOpen, setToolsOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const emojiButtonRef = useRef(null);
    const compact = isMobile && (isDrawing || isEmojiPickerOpen || !!editingText);

    const closeTools = () => {
        stopDrawing();
        deselectFeature?.();
        setIsEmojiPickerOpen(false);
        setIsListOpen(false);
        setToolsOpen(false);
    };

    const mostrarMedicion = (id) => abrirInfoBoxDeMedicion({
        medicion: measurements.find(m => m.id === id),
        setSelectedFeatureInfo,
        clickPosition,
    });

    const togglePill = () => {
        trackCatalogoToolsToggle(!toolsOpen);
        if (toolsOpen) closeTools();
        else setToolsOpen(true);
    };

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
        setEmojiTemplate?.(symbol);
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

    const toggleButton = (
        <Tooltip content={toolsOpen ? 'Cerrar herramientas' : 'Medir y anotar sobre el mapa'} placement="right" delay={300}>
            <button
                type="button"
                onClick={togglePill}
                aria-pressed={toolsOpen}
                aria-label={toolsOpen ? 'Cerrar herramientas de medición y anotación' : 'Herramientas de medición y anotación'}
                className={[
                    'size-10 rounded-full flex items-center justify-center shadow-[0_5px_20px_#1A26641A] transition-colors cursor-pointer',
                    toolsOpen ? 'bg-[#FFE6EC] text-[#FF577D] hover:bg-[#FF577D] hover:text-white' : 'bg-white text-graphite hover:bg-purple-soft'
                ].join(' ')}
            >
                {toolsOpen ? <CloseIcon className="size-5 shrink-0" /> : <RulerIcon className="size-5 shrink-0" />}
            </button>
        </Tooltip>
    );

    const tablaButton = <CatalogoTablaButton layerId={tabla.layerId} disponible={tabla.disponible} hayCapa={hayCapa} />;

    return (
        <div className="fixed left-4 top-29 z-20 flex flex-col gap-2 items-start">
            {!toolsOpen && toggleButton}
            {!toolsOpen && tablaButton}

            {toolsOpen && (
                <>
                    <PanelDeLineaNueva
                        measurements={measurements}
                        mapRef={mapRef}
                        setSelectedFeatureInfo={setSelectedFeatureInfo}
                        clickPosition={clickPosition}
                    />

                    <HistoryButton
                        count={measurements.length}
                        onClick={() => setIsListOpen((v) => !v)}
                        isOpen={isListOpen}
                        tooltip="Mediciones y anotaciones"
                        size="size-10"
                        iconSize="size-8"
                    />

                    <ToolSelector
                        visible
                        compact={compact}
                        isDrawing={isDrawing}
                        measureType={measureType}
                        isEmojiPickerOpen={isEmojiPickerOpen}
                        onSelect={handleMeasureTypeClick}
                        onTextToggle={handleTextButton}
                        onEmojiToggle={handleEmojiButton}
                        emojiButtonRef={emojiButtonRef}
                        onUndo={undoLastPoint}
                        onFinish={finishCurrentSketch}
                        onCancel={cancelCurrentSketch}
                        canUndo={isSketching}
                        freehandColor={freehandColor}
                        freehandWidth={freehandWidth}
                        onFreehandColor={setFreehandColor}
                        onFreehandWidth={setFreehandWidth}
                        showMeasurements
                        showAnnotations
                        buttonClass="size-10"
                        iconClass="size-8"
                    />

                    <EmojiPanel
                        open={isEmojiPickerOpen}
                        anchorRef={emojiButtonRef}
                        onSelect={handleEmojiSelect}
                        onClose={() => setIsEmojiPickerOpen(false)}
                        placedCount={measurements.filter((m) => m.type === 'Emoji').length}
                    />

                    <TextInlineEditor
                        mapRef={mapRef}
                        feature={editingText}
                        onChange={updateEditingTextLabel}
                        onCommit={commitTextEdit}
                        onCancel={cancelTextEdit}
                    />

                    <HistoryPanel
                        open={isListOpen}
                        measurements={measurements}
                        onDelete={deleteMeasurement}
                        onToggleVisibility={toggleMeasurementVisibility}
                        onClose={() => setIsListOpen(false)}
                        onShowSelection={showSelection}
                        onShowMeasurement={mostrarMedicion}
                        onClearAll={clearDrawings}
                    />

                    {selectedFeature && (
                        <FeatureEditToolbar
                            mapRef={mapRef}
                            feature={selectedFeature}
                            selectionTick={selectionTick}
                            onRotate={updateRotation}
                            onScale={updateScale}
                            onFillColor={updateFillColor}
                            onBgColor={updateBgColor}
                            onStrokeColor={updateStrokeColor}
                            onStrokeWidth={updateStrokeWidth}
                            onEdit={startTextEdit}
                            onPin={updatePin}
                            onDelete={deleteSelected}
                            onClose={deselectFeature}
                        />
                    )}

                    {toggleButton}
                    {tablaButton}
                </>
            )}
        </div>
    );
};

export default CatalogoTools;
