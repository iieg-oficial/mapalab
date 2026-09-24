
import { useEffect, useState } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import ConfirmDropdown from '@components/ConfirmDropdown';
import MeasurementSettingsButton from './MeasurementSettings';

const TYPE_ICONS = {
    LineString: 'linea',
    Polygon: 'poligono',
    Freehand: 'pencil',
    Text: 'text',
    Emoji: 'emoji',
    Point: 'punto'
};

const HistoryPanel = ({ open, measurements, onDelete, onToggleVisibility, onClose, onShowSelection, onShowMeasurement = null, onClearAll = null }) => {
    const { className: positionClass } = useSiderAdaptivePosition({ anchorRef: 'listMeasurements' });
    const [confirmarBorrado, setConfirmarBorrado] = useState(false);

    useEffect(() => {
        if (open && measurements.length === 0) {
            onClose?.();
        }
    }, [measurements.length, open, onClose]);

    return (
        <div
            className={`
                fixed z-10 flex-col gap-2 ml-15 items-start w-[334px] max-md:max-w-[calc(100vw-5rem)] px-3 pb-3
                border border-transparent bg-[#F9FBFF] rounded-[12px] shadow-none
                ${open ? 'flex' : 'hidden'} ${positionClass}
            `}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center font-garet font-bold text-[14px]/[47px] text-graphite gap-5">
                    Mis mediciones
                    <Badge count={measurements.length} />
                </div>
                <div className="relative flex items-center gap-0.5">
                    {onClearAll && (
                        <Tooltip content="Eliminar todas las mediciones y anotaciones" delay={500}>
                            <button
                                type="button"
                                onClick={() => setConfirmarBorrado(true)}
                                className="flex items-center justify-center size-7 rounded-full border border-transparent hover:border-[#FF577D] transition-colors cursor-pointer"
                                aria-label="Eliminar todas las mediciones"
                            >
                                <Icon name="eliminar" state="hover" className="size-5" />
                            </button>
                        </Tooltip>
                    )}
                    <MeasurementSettingsButton />
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center size-7 cursor-pointer"
                        aria-label="Cerrar lista de mediciones y anotaciones"
                    >
                        <Icon name="cerrarModal" className="size-7" />
                    </button>
                    <ConfirmDropdown
                        open={confirmarBorrado}
                        onClose={() => setConfirmarBorrado(false)}
                        onConfirm={onClearAll}
                        title="¿Borrar todas tus mediciones y anotaciones?"
                        description="Se quitan del mapa y de la lista; no se pueden recuperar"
                        confirmText="Sí, borrar todo"
                        className="right-0"
                    />
                </div>
            </div>
            
            <div className="px-1.5 py-3 rounded-[7px] bg-white space-y-3 w-full">
                {measurements.map((measurement) => (
                    <div
                        key={measurement.id}
                        className="flex items-center gap-2 transition group"
                    >
                        <div className="flex items-center justify-between w-full min-w-0 gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Icon name={TYPE_ICONS[measurement.type]} className="size-6 shrink-0" />
                                <div className="text-[14px]/[16px] font-garet font-medium text-graphite min-w-0 whitespace-pre-line break-words">
                                    {measurement.label}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {measurement.type === 'LineString' && onShowMeasurement && (
                                    <Tooltip content="Ver la distancia" placement="top" delay={500}>
                                        <button
                                            type="button"
                                            onClick={() => onShowMeasurement(measurement.id)}
                                            className={`
                                                flex items-center justify-center size-6 border border-transparent rounded-full hover:border-purple-deep hover:bg-[#F9FBFF]
                                            `}
                                            aria-label={`Ver la distancia de ${measurement.label} `}
                                        >
                                            <Icon name="info" state="normal" className="size-4" />
                                        </button>
                                    </Tooltip>
                                )}
                                {measurement.type === 'Polygon' && (
                                    <Tooltip content="Ver tarjetas seleccionadas" placement="top" delay={500}>
                                        <button
                                            type="button"
                                            onClick={() => onShowSelection?.(measurement.id)}
                                            className={`
                                                flex items-center justify-center size-6 border border-transparent rounded-full hover:border-purple-deep hover:bg-[#F9FBFF]
                                            `}
                                            aria-label={`Mostrar tarjetas seleccionadas de ${measurement.label} `}
                                        >
                                            <Icon name="big_card" state="normal" className="size-4" />
                                        </button>
                                    </Tooltip>
                                )}
                                <Tooltip content={measurement.visible === false ? 'Mostrar' : 'Ocultar'} placement="top" delay={500}>
                                    <button
                                        type="button"
                                        onClick={() => onToggleVisibility?.(measurement.id)}
                                        className={`
                                            flex items-center justify-center size-6 border border-transparent rounded-full hover:border-purple-deep hover:bg-[#F9FBFF]
                                        `}
                                        aria-label={`${measurement.visible === false ? 'Mostrar' : 'Ocultar'} ${measurement.label} `}
                                    >
                                        <Icon name="visible" state={measurement.visible ? 'normal' : 'hover'} className="size-4" />
                                    </button>
                                </Tooltip>
                                <Tooltip content="Eliminar" placement="top" delay={500}>
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.(measurement.id)}
                                        className={`
                                            flex items-center justify-center size-6 border border-transparent rounded-full hover:border-[#FF577D] hover:bg-[#F9FBFF]
                                        `}
                                        aria-label={`Eliminar ${measurement.label} `}
                                    >
                                        <Icon name="eliminar" state="hover" className="size-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                ))}
            </div >
        </div>
    );
};
export default HistoryPanel;
