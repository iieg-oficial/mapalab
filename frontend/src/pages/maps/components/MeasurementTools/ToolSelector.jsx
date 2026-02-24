import { useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import UndoButton from './UndoButton';

const measurementTypes = [
    {
        id: 'Point',
        description: 'Modo normal del mapa - click para obtener información de puntos',
        icon: 'punto'
    },
    {
        id: 'LineString',
        description: 'Medir distancia: haz click para puntos, doble click/ESC para terminar la línea.',
        icon: 'linea'
    },
    {
        id: 'Polygon',
        description: 'Medir área y seleccionar: dibuja un polígono para medir su área y ver los elementos dentro.',
        icon: 'poligono'
    },
    {
        id: 'Freehand',
        description: 'Trazos libres: mantén presionado y dibuja líneas a mano alzada.',
        icon: 'pencil'
    },
    {
        id: 'Text',
        description: 'Texto: coloca etiquetas en el mapa con notas o títulos.',
        icon: 'text'
    },
    {
        id: 'Emoji',
        description: 'Coloca emojis directamente sobre el mapa. Alt + A para más herramientas.',
        icon: 'emoji'
    }
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
    canUndo,
    showAdvancedTools,
    onToggleAdvanced,
    visible = true
}) => {
    const longPressTimer = useRef(null);
    const [hoveredId, setHoveredId] = useState(null);

    if (!visible) return null;

    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            onToggleAdvanced?.();
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const getIconState = (_typeId, isActive) => {
        if (isActive) return 'hover';
        return 'normal';
    };

    const renderButton = (type, props, isActive, isEmoji = false) => {
        const isHovered = hoveredId === type.id;
        const iconState = getIconState(type.id, isActive, isHovered);

        return (
            <button
                className={[
                    'flex items-center justify-center transition-all rounded-full border border-transparent p-1',
                    isActive ? 'bg-[#703089] text-white' : 'bg-[#EAEFFA] text-[#703089] hover:border-[#5C2472]'
                ].join(' ')}
                aria-pressed={isActive}
                onMouseEnter={() => setHoveredId(type.id)}
                onMouseLeave={() => setHoveredId(null)}
                onTouchStart={isEmoji ? handleTouchStart : undefined}
                onTouchEnd={isEmoji ? handleTouchEnd : undefined}
                onTouchCancel={isEmoji ? handleTouchEnd : undefined}
                {...props}
            >
                <Icon name={type.icon} state={iconState} className="w-7.5 h-7.5" />
            </button>
        );
    };

    const undoEnabledTypes = new Set(['LineString', 'Polygon', 'Select']);
    const advancedTools = new Set(['Freehand', 'Text']);

    const visibleTypes = measurementTypes.filter(type => {
        if (advancedTools.has(type.id)) {
            return showAdvancedTools;
        }
        return true;
    });

    return (
        <div className="flex flex-col gap-1 overflow-visible">
            {visibleTypes.map((type) => {
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

                const commonProps = {
                    type: 'button',
                    onClick: () => {
                        if (isText) {
                            onTextToggle?.();
                        } else if (isEmoji) {
                            onEmojiToggle?.();
                        } else {
                            onSelect?.(type.id);
                        }
                    }
                };
                const buttonProps = {
                    ...commonProps,
                    ref: isText ? textButtonRef : isEmoji ? emojiButtonRef : undefined
                };

                const showUndoButton = undoEnabledTypes.has(type.id) && isActive;

                return (
                    <div key={type.id} className="relative">
                        <Tooltip
                            content={type.description}
                            placement="top"
                            delay={400}
                        >
                            {renderButton(type, buttonProps, isActive, isEmoji)}
                        </Tooltip>

                        {showUndoButton && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-4 animate-[slideIn_0.2s_ease-out] -z-10">
                                <UndoButton
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                    showLabel={false}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ToolSelector;

