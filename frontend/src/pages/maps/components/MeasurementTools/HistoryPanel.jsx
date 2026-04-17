
import { useEffect } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const TYPE_ICONS = {
    LineString: 'linea',
    Polygon: 'poligono',
    Freehand: 'pencil',
    Text: 'text',
    Emoji: 'emoji',
    Point: 'punto'
};

const HistoryPanel = ({ open, measurements, onDelete, onToggleVisibility, onClose, onShowSelection }) => {
    const { className: positionClass } = useSiderAdaptivePosition({ anchorRef: 'listMeasurements' });

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
                <div className="flex items-center font-garet font-bold text-[14px]/[47px] text-[#465055] gap-5">
                    Mis mediciones
                    <Badge count={measurements.length} />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer"
                >
                    <Icon name="cerrarModal" className="size-7" />
                </button>
            </div>
            
            <div className="px-1.5 py-3 rounded-[7px] bg-white space-y-3 w-full">
                {measurements.map((measurement, index) => (
                    <div
                        key={measurement.id}
                        className="flex items-center gap-2 transition group"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 flex-1">
                                <Icon name={TYPE_ICONS[measurement.type]} className="size-6" />
                                <div className="text-[14px]/[16px] font-garet font-medium text-[#465055] truncate">
                                    {measurement.label}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {measurement.type === 'Polygon' && (
                                    <Tooltip content="Ver tarjetas seleccionadas" placement="top" delay={500}>
                                        <button
                                            type="button"
                                            onClick={() => onShowSelection?.(index)}
                                            className={`
                                                flex items-center justify-center size-6 border border-transparent rounded-full hover:border-[#70308A] hover:bg-[#F9FBFF]
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
                                        onClick={() => onToggleVisibility?.(index)}
                                        className={`
                                            flex items-center justify-center size-6 border border-transparent rounded-full hover:border-[#70308A] hover:bg-[#F9FBFF]
                                        `}
                                        aria-label={`${measurement.visible === false ? 'Mostrar' : 'Ocultar'} ${measurement.label} `}
                                    >
                                        <Icon name="visible" state={measurement.visible ? 'normal' : 'hover'} className="size-4" />
                                    </button>
                                </Tooltip>
                                <Tooltip content="Eliminar" placement="top" delay={500}>
                                    <button
                                        type="button"
                                        onClick={() => onDelete?.(index)}
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
