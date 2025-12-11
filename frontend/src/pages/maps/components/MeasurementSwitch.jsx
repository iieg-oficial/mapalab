import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import UndoButton from './UndoButton';

const measurementTypes = [
    {
        id: 'Point',
        description: 'Modo normal del mapa - click para obtener información de puntos',
        icon: 'select'
    },
    {
        id: 'LineString',
        description: 'Medir distancia: haz click para puntos, doble click/ESC para terminar la línea.',
        icon: 'ruler'
    },
    {
        id: 'Polygon',
        description: 'Medir área y seleccionar: dibuja un polígono para medir su área y ver los elementos dentro.',
        icon: 'layers'
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
        description: 'Coloca emojis directamente sobre el mapa.',
        icon: 'smile'
    }
];

const MeasurementSwitch = ({
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
    measurementConfig
}) => {
    const renderButton = (type, props, isActive) => (
        <button
            className={[
                'w-full flex items-center justify-center px-3 py-2 transition-colors rounded-xl',
                isActive
                    ? 'bg-blue-500 text-white shadow-lg rounded-2xl'
                    : 'text-gray-700  hover:bg-white/70'
            ].join(' ')}
            aria-pressed={isActive}
            {...props}
        >
            <Icon name={type.icon} />
        </button>
    );

    const undoEnabledTypes = new Set(['LineString', 'Polygon', 'Select']);
    const annotationTools = new Set(['Freehand', 'Text', 'Emoji']);
    const enableAnnotationTools = measurementConfig?.enableAnnotationTools ?? false;

    const visibleTypes = measurementTypes.filter(type => {
        if (annotationTools.has(type.id)) {
            return enableAnnotationTools;
        }
        return true;
    });

    return (
        <div className="flex flex-col gap-1 rounded-2xl border border-white/60  bg-white/80  backdrop-blur-sm shadow overflow-visible">
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
                            placement="right"
                            delay={400}
                        >
                            {renderButton(type, buttonProps, isActive)}
                        </Tooltip>

                        {showUndoButton && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3">
                                <UndoButton
                                    onClick={onUndo}
                                    disabled={!canUndo}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MeasurementSwitch;
