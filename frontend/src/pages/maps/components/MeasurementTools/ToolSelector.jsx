import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import UndoButton from './UndoButton';
import { ColorSwatch, Stepper } from './StyleControls';

const WIDTH_MIN = 1;
const WIDTH_MAX = 12;

const measurementGroup = [
    {
        id: 'Point',
        description: 'Modo normal del mapa - click para obtener información de puntos',
        icon: 'punto'
    },
    {
        id: 'LineString',
        description: 'Medir distancia: haz click para puntos, doble click/ESC para terminar.',
        icon: 'linea'
    },
    {
        id: 'Polygon',
        description: 'Medir área y seleccionar: dibuja un polígono para medir su área y ver los elementos dentro.',
        icon: 'poligono'
    },
];

const annotationGroup = [
    {
        id: 'Text',
        description: 'Texto: coloca etiquetas en el mapa con notas o títulos.',
        icon: 'text'
    },
    {
        id: 'Emoji',
        description: 'Coloca emojis directamente sobre el mapa.',
        icon: 'emoji'
    },
    {
        id: 'Freehand',
        description: 'Trazos libres: mantén presionado y dibuja líneas a mano alzada.',
        icon: 'pencil'
    },
];

const ToolSelector = ({
    isDrawing,
    measureType,
    isEmojiPickerOpen,
    onSelect,
    onTextToggle,
    onEmojiToggle,
    emojiButtonRef,
    onUndo,
    onFinish,
    onCancel,
    canUndo,
    freehandColor,
    freehandWidth,
    onFreehandColor,
    onFreehandWidth,
    showAnnotations = true,
    showMeasurements = true,
    compact = false,
    visible = true,
    buttonClass = 'size-12.5',
    iconClass = 'size-10'
}) => {
    if (!visible) return null;

    const getIconState = (typeId, isActive) => {
        if (isActive) return 'hover';
        return 'normal';
    };

    const renderButton = (type, props, isActive) => {
        const iconState = getIconState(type.id, isActive);

        return (
            <button
                className={[
                    buttonClass,
                    'flex items-center justify-center transition-all rounded-full border border-transparent',
                    isActive ? 'bg-purple-deep text-white' : 'bg-[#EAEFFA] text-purple-deep hover:border-purple'
                ].join(' ')}
                aria-pressed={isActive}
                {...props}
            >
                <Icon name={type.icon} state={iconState} className={iconClass} />
            </button>
        );
    };

    const undoEnabledTypes = new Set(['LineString', 'Polygon', 'Select']);

    const renderTool = (type) => {
        const isText = type.id === 'Text';
        const isEmoji = type.id === 'Emoji';
        const isPoint = type.id === 'Point';

        const isActive = isText
            ? (measureType === 'Text' && isDrawing)
            : isEmoji
                ? isEmojiPickerOpen || (measureType === 'Emoji' && isDrawing)
                : isPoint
                    ? !isDrawing
                    : measureType === type.id && isDrawing;

        const buttonProps = {
            type: 'button',
            onClick: () => {
                if (isText) onTextToggle?.();
                else if (isEmoji) onEmojiToggle?.();
                else onSelect?.(type.id);
            },
            ref: isEmoji ? emojiButtonRef : undefined,
        };

        const showUndoButton = undoEnabledTypes.has(type.id) && isActive;
        const showFreehandBar = type.id === 'Freehand' && isActive;

        return (
            <div key={type.id} className="relative">
                <Tooltip content={type.description} placement="top" delay={400}>
                    {renderButton(type, buttonProps, isActive)}
                </Tooltip>
                {showFreehandBar && (
                    <div className="flex items-center absolute left-full top-1/2 -translate-y-1/2 -ml-5 animate-[slideIn_0.2s_ease-out] -z-10 gap-1 bg-white rounded-r-[10px] rounded-l-none pl-6 pr-1.5 py-1 shadow-[0_5px_20px_#1A26641A]">
                        <ColorSwatch
                            value={freehandColor}
                            onChange={onFreehandColor}
                            tooltip="Color del trazo"
                            ariaLabel="Color del trazo"
                        />
                        <Stepper
                            onDown={() => onFreehandWidth?.(Math.max(WIDTH_MIN, (freehandWidth || 3) - 1))}
                            onUp={() => onFreehandWidth?.(Math.min(WIDTH_MAX, (freehandWidth || 3) + 1))}
                            downLabel="Menos grosor"
                            upLabel="Más grosor"
                            tooltipDown="Menos grosor"
                            tooltipUp="Más grosor"
                        />
                    </div>
                )}
                {showUndoButton && canUndo && (
                    <div className="flex absolute left-full top-1/2 -translate-y-1/2 -ml-5 animate-[slideIn_0.2s_ease-out] -z-10 gap-1 bg-white rounded-r-[10px] rounded-l-none pl-6 pr-1.5 py-1 shadow-[0_5px_20px_#1A26641A]">
                        <UndoButton onClick={onUndo} disabled={!canUndo} showLabel={false} />
                        <Tooltip content="Terminar trazo" placement="top" delay={300}>
                            <button type="button" onClick={onFinish} className="flex items-center justify-center rounded-full border border-transparent size-8 text-purple-deep hover:border-purple active:bg-purple-deep active:text-white transition-all" aria-label="Terminar trazo">
                                <Icon name="shared_click" state="normal" className="size-5 shrink-0" />
                            </button>
                        </Tooltip>
                        <Tooltip content="Cancelar trazo" placement="right" delay={300}>
                            <button type="button" onClick={onCancel} className="flex items-center justify-center rounded-full border border-transparent size-8 text-[#FF577D] hover:border-[#FF577D] active:bg-[#FF577D] active:text-white transition-all" aria-label="Cancelar trazo">
                                <Icon name="close" className="size-5 shrink-0" />
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
        );
    };

    const isActiveTool = (t) => {
        if (t.id === 'Text') return measureType === 'Text';
        if (t.id === 'Emoji') return isEmojiPickerOpen || measureType === 'Emoji';
        return measureType === t.id;
    };

    const visibleMeasurements = measurementGroup.filter(t => !compact || isActiveTool(t));
    const visibleAnnotations = annotationGroup.filter(t => !compact || isActiveTool(t));
    const bothOpen = (showMeasurements && visibleMeasurements.length > 0) && (showAnnotations && visibleAnnotations.length > 0);
    const groupClass = compact
        ? 'flex flex-col gap-1'
        : 'max-md:flex max-md:flex-wrap max-md:gap-1 max-md:[&>*]:w-[calc(50%-2px)] flex flex-col gap-1';

    return (
        <div className={`flex overflow-visible gap-2 ${bothOpen && !compact ? 'max-md:flex-row flex-col' : 'flex-col'}`}>
            {showMeasurements && visibleMeasurements.length > 0 && (
                <div className={groupClass}>
                    {visibleMeasurements.map(renderTool)}
                </div>
            )}
            {showAnnotations && visibleAnnotations.length > 0 && (
                <div className={groupClass}>
                    {visibleAnnotations.map(renderTool)}
                </div>
            )}
        </div>
    );
};

export default ToolSelector;

