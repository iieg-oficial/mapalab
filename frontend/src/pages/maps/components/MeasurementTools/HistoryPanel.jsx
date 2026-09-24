
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
    Point: 'punto',
    Pin: 'pin'
};

const InfoSinFondo = () => (
    <svg viewBox="0 0 26.402 27.593" className="size-4" aria-hidden="true">
        <path fill="#703088" d="M13.119 0a13.1 13.1 0 0 0-11.6 19.227L.741 24.9a2.37 2.37 0 0 0 .836 2.169A2.33 2.33 0 0 0 3 27.593a2.3 2.3 0 0 0 .751-.128l5.459-1.886A13.116 13.116 0 1 0 13.119 0m0 24.1a10.9 10.9 0 0 1-3.545-.6.98.98 0 0 0-.694 0l-5.8 2a.14.14 0 0 1-.156 0 .24.24 0 0 1-.085-.241l.837-6.059a1.1 1.1 0 0 0-.128-.667 10.988 10.988 0 1 1 9.571 5.573Zm2.481-4.957a1.08 1.08 0 0 1-1.063 1.063H11.7a1.064 1.064 0 0 1 0-2.127h.355V11.7H11.7a1.064 1.064 0 1 1 0-2.127h1.418a1.08 1.08 0 0 1 1.063 1.063v7.444h.355a1.08 1.08 0 0 1 1.064 1.063M11.347 7.09a1.418 1.418 0 1 1 1.417 1.418 1.42 1.42 0 0 1-1.417-1.418" />
    </svg>
);

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
                                {(measurement.type === 'LineString' || measurement.type === 'Pin') && onShowMeasurement && (
                                    <Tooltip content={measurement.type === 'Pin' ? 'Ver coordenadas y altura' : 'Ver la distancia'} placement="top" delay={500}>
                                        <button
                                            type="button"
                                            onClick={() => onShowMeasurement(measurement.id)}
                                            className={`
                                                flex items-center justify-center size-6 border border-transparent rounded-full hover:border-purple-deep hover:bg-[#F9FBFF]
                                            `}
                                            aria-label={`Ver la información de ${measurement.label} `}
                                        >
                                            <InfoSinFondo />
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
