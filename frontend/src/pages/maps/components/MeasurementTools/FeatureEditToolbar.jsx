import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Overlay from 'ol/Overlay';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { ACTION_BTN, PURPLE_HOVER, PINK_HOVER, BAR_SHELL, BAR_DIVIDER, ColorSwatch, Stepper } from './StyleControls';
import { DEFAULT_TEXT_FILL, DRAW_COLORS } from '@pages/maps/helpers/drawingConstants';
import { PIN_ETIQUETAS, PIN_ETIQUETA_INICIAL } from '@pages/maps/helpers/pin';

const ROTATE_STEP = Math.PI / 4;
const SCALE_STEP = 0.25;
const SCALE_MIN = 0.5;
const SCALE_MAX = 3;
const WIDTH_STEP = 1;
const WIDTH_MIN = 1;
const WIDTH_MAX = 12;

const positionFor = (geometry) => {
    if (!geometry) return null;
    const type = geometry.getType();
    if (type === 'Point') return geometry.getCoordinates();
    if (type === 'LineString') {
        const coords = geometry.getCoordinates();
        return coords[Math.floor(coords.length / 2)] || coords[0];
    }
    const extent = geometry.getExtent();
    return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
};

const FeatureEditToolbar = ({
    mapRef,
    feature,
    selectionTick,
    onRotate,
    onScale,
    onFillColor,
    onBgColor,
    onStrokeColor,
    onStrokeWidth,
    onEdit,
    onPin,
    onDelete,
    onClose
}) => {
    const elementRef = useRef(null);
    const overlayRef = useRef(null);

    if (!elementRef.current && typeof document !== 'undefined') {
        const el = document.createElement('div');
        el.style.pointerEvents = 'auto';
        elementRef.current = el;
    }

    const [, forceRerender] = useState(0);
    useEffect(() => {
        forceRerender(v => v + 1);
    }, [selectionTick]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map || !feature || !elementRef.current) return;

        const overlay = new Overlay({
            element: elementRef.current,
            positioning: 'bottom-center',
            offset: [0, -28],
            stopEvent: true,
            insertFirst: false
        });

        const geom = feature.getGeometry();
        if (geom) overlay.setPosition(positionFor(geom));

        map.addOverlay(overlay);
        overlayRef.current = overlay;

        const syncPosition = () => {
            const g = feature.getGeometry();
            if (g) overlay.setPosition(positionFor(g));
        };
        feature.on('change', syncPosition);

        return () => {
            feature.un('change', syncPosition);
            map.removeOverlay(overlay);
            overlayRef.current = null;
        };
    }, [mapRef, feature]);

    const annotationType = feature?.get('annotationType');
    const isText = annotationType === 'Text';
    const isEmoji = annotationType === 'Emoji';
    const isFreehand = annotationType === 'Freehand';
    const isPin = annotationType === 'Pin';
    const pinEtiqueta = feature?.get('pinEtiqueta') || PIN_ETIQUETA_INICIAL;
    const pinTexto = feature?.get('textLabel') || '';

    const currentRotation = feature?.get('rotation') ?? 0;
    const currentScale = feature?.get('scale') ?? 1;
    const currentFill = feature?.get('fillColor') || DEFAULT_TEXT_FILL;
    const currentBg = feature?.get('bgColor') || '';
    const currentStroke = feature?.get('strokeColor') || DRAW_COLORS.pink;
    const currentWidth = feature?.get('strokeWidth') || 3;

    const content = useMemo(() => {
        const rotateLeft = () => onRotate?.(currentRotation - ROTATE_STEP);
        const rotateRight = () => onRotate?.(currentRotation + ROTATE_STEP);
        const scaleDown = () => onScale?.(Math.max(SCALE_MIN, +(currentScale - SCALE_STEP).toFixed(2)));
        const scaleUp = () => onScale?.(Math.min(SCALE_MAX, +(currentScale + SCALE_STEP).toFixed(2)));
        const widthDown = () => onStrokeWidth?.(Math.max(WIDTH_MIN, currentWidth - WIDTH_STEP));
        const widthUp = () => onStrokeWidth?.(Math.min(WIDTH_MAX, currentWidth + WIDTH_STEP));

        return (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- toolbar contenedor; stopPropagation previene que el mapa reciba drag/touch
            <div
                className={BAR_SHELL}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                {isPin && (
                    <div className="flex items-center gap-1" role="radiogroup" aria-label="Etiqueta del pin">
                        {PIN_ETIQUETAS.map(({ id, texto }) => (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={pinEtiqueta === id}
                                onClick={() => onPin?.({ pinEtiqueta: id })}
                                className={`rounded-full px-2.5 py-1 font-garet text-[11px] font-bold whitespace-nowrap transition ${pinEtiqueta === id ? 'bg-purple-deep text-white' : 'bg-[#EAEFFA] text-purple-deep hover:bg-[#dfe6f7]'}`}
                            >
                                {texto}
                            </button>
                        ))}
                        {pinEtiqueta === 'texto' && (
                            <input
                                type="text"
                                value={pinTexto}
                                maxLength={60}
                                placeholder="Escribe la etiqueta"
                                aria-label="Texto del pin"
                                onChange={(e) => onPin?.({ textLabel: e.target.value })}
                                className="w-36 rounded-full border border-[#D5DDF0] bg-white px-2.5 py-1 font-garet text-[11px] text-graphite outline-none focus:border-purple-deep"
                            />
                        )}
                    </div>
                )}

                {(isText || isFreehand) && (
                    <ColorSwatch
                        value={isText ? currentFill : currentStroke}
                        onChange={isText ? onFillColor : onStrokeColor}
                        tooltip="Color"
                        ariaLabel="Color"
                    />
                )}
                {isText && (
                    <ColorSwatch
                        value={currentBg}
                        onChange={onBgColor}
                        tooltip="Fondo"
                        ariaLabel="Color de fondo"
                        allowNone
                    />
                )}

                {(isText || isEmoji) && (
                    <Stepper
                        onDown={scaleDown}
                        onUp={scaleUp}
                        downLabel="Reducir tamaño"
                        upLabel="Aumentar tamaño"
                        tooltipDown="Reducir tamaño"
                        tooltipUp="Aumentar tamaño"
                    />
                )}
                {isFreehand && (
                    <Stepper
                        onDown={widthDown}
                        onUp={widthUp}
                        downLabel="Menos grosor"
                        upLabel="Más grosor"
                        tooltipDown="Menos grosor"
                        tooltipUp="Más grosor"
                    />
                )}

                {isText && onEdit && (
                    <>
                        <div className={BAR_DIVIDER} />
                        <Tooltip content="Editar texto" delay={500}>
                            <button type="button" onClick={() => onEdit(feature)} className={`${ACTION_BTN} ${PURPLE_HOVER}`} aria-label="Editar texto">
                                <Icon name="text" className="size-4 text-graphite" />
                            </button>
                        </Tooltip>
                    </>
                )}

                {(isText || isEmoji) && (
                    <>
                        <div className={BAR_DIVIDER} />
                        <Tooltip content="Rotar −45°" delay={500}>
                            <button type="button" onClick={rotateLeft} className={`${ACTION_BTN} ${PURPLE_HOVER}`} aria-label="Rotar a la izquierda">
                                <Icon name="undo" className="size-4 text-graphite" />
                            </button>
                        </Tooltip>
                        <Tooltip content="Rotar +45°" delay={500}>
                            <button type="button" onClick={rotateRight} className={`${ACTION_BTN} ${PURPLE_HOVER}`} aria-label="Rotar a la derecha">
                                <span className="inline-flex scale-x-[-1]">
                                    <Icon name="undo" className="size-4 text-graphite" />
                                </span>
                            </button>
                        </Tooltip>
                    </>
                )}

                <div className={BAR_DIVIDER} />
                <Tooltip content="Eliminar" delay={500}>
                    <button type="button" onClick={onDelete} className={`${ACTION_BTN} ${PINK_HOVER}`} aria-label="Eliminar">
                        <Icon name="eliminar" state="hover" className="size-4" />
                    </button>
                </Tooltip>
                <Tooltip content="Listo" delay={500}>
                    <button type="button" onClick={onClose} className={`${ACTION_BTN} ${PURPLE_HOVER}`} aria-label="Terminar edicion">
                        <Icon name="done" className="size-4 text-graphite" />
                    </button>
                </Tooltip>
            </div>
        );
    }, [feature, isText, isEmoji, isFreehand, isPin, pinEtiqueta, pinTexto, currentRotation, currentScale, currentFill, currentBg, currentStroke, currentWidth, onRotate, onScale, onFillColor, onBgColor, onStrokeColor, onStrokeWidth, onEdit, onPin, onDelete, onClose]);

    if (!feature || !elementRef.current) return null;
    return createPortal(content, elementRef.current);
};

export default FeatureEditToolbar;
