import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import UndoButton from './UndoButton';

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
    isTextPanelOpen,
    isEmojiPickerOpen,
    onSelect,
    onTextToggle,
    onEmojiToggle,
    textButtonRef,
    emojiButtonRef,
    onUndo,
    onFinish,
    onCancel,
    canUndo,
    showAnnotations = true,
    showMeasurements = true,
    compact = false,
    visible = true
}) => {
    const [hoveredId, setHoveredId] = useState(null);

    if (!visible) return null;

    const getIconState = (typeId, isActive, isHovered) => {
        if (isActive) return 'hover';
        return 'normal';
    };

    const renderButton = (type, props, isActive, isEmoji = false) => {
        const isHovered = hoveredId === type.id;
        const iconState = getIconState(type.id, isActive, isHovered);

        return (
            <button
                className={[
                    'size-12.5 flex items-center justify-center transition-all rounded-full border border-transparent',
                    isActive ? 'bg-[#703089] text-white' : 'bg-[#EAEFFA] text-[#703089] hover:border-[#5C2472]'
                ].join(' ')}
                aria-pressed={isActive}
                onMouseEnter={() => setHoveredId(type.id)}
                onMouseLeave={() => setHoveredId(null)}
                {...props}
            >
                <Icon name={type.icon} state={iconState} className="size-10" />
            </button>
        );
    };

    const undoEnabledTypes = new Set(['LineString', 'Polygon', 'Select']);

    const renderTool = (type) => {
        const isText = type.id === 'Text';
        const isEmoji = type.id === 'Emoji';
        const isPoint = type.id === 'Point';

        const isActive = isText
            ? isTextPanelOpen || (measureType === 'Text' && isDrawing)
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
            ref: isText ? textButtonRef : isEmoji ? emojiButtonRef : undefined,
        };

        const showUndoButton = undoEnabledTypes.has(type.id) && isActive;

        return (
            <div key={type.id} className="relative">
                <Tooltip content={type.description} placement="top" delay={400}>
                    {renderButton(type, buttonProps, isActive, isEmoji)}
                </Tooltip>
                {showUndoButton && canUndo && (
                    <div className="hidden md:flex absolute left-full top-1/2 -translate-y-1/2 -ml-5 animate-[slideIn_0.2s_ease-out] -z-10 gap-1 bg-white rounded-r-[10px] rounded-l-none pl-6 pr-1.5 py-1 shadow-[0_5px_20px_#1A26641A]">
                        <UndoButton onClick={onUndo} disabled={!canUndo} showLabel={false} />
                        <Tooltip content="Terminar trazo" placement="top" delay={300}>
                            <button type="button" onClick={onFinish} className="flex items-center justify-center rounded-full border border-transparent size-8 text-[#703089] hover:border-[#5C2472] active:bg-[#703089] active:text-white transition-all" aria-label="Terminar trazo">
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

    const bothOpen = showMeasurements && showAnnotations;
    const isActiveTool = (t) => {
        if (t.id === 'Text') return isTextPanelOpen || measureType === 'Text';
        if (t.id === 'Emoji') return isEmojiPickerOpen || measureType === 'Emoji';
        return measureType === t.id;
    };

    return (
        <div className={`flex overflow-visible ${bothOpen && !compact ? 'max-md:flex-row flex-col' : 'flex-col'}`}>
            {showMeasurements && (
                <div className="max-md:flex max-md:flex-wrap max-md:gap-1 max-md:[&>*]:w-[calc(50%-2px)] flex flex-col gap-1">
                    {measurementGroup.filter(t => !compact || isActiveTool(t)).map(renderTool)}
                </div>
            )}
            {showAnnotations && (
                <div className="max-md:flex max-md:flex-wrap max-md:gap-1 max-md:[&>*]:w-[calc(50%-2px)] flex flex-col gap-1">
                    {annotationGroup.filter(t => !compact || isActiveTool(t)).map(renderTool)}
                </div>
            )}
        </div>
    );
};

export default ToolSelector;

