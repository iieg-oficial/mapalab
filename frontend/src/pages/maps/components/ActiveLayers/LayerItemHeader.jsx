import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

export const DragHandle = ({ dragHandleProps }) => {
    const [isMoveActive, setIsMoveActive] = useState(false);
    if (!dragHandleProps) return null;
    return (
        <Tooltip content="Reordenar capa">
            <button
                {...dragHandleProps}
                className="p-0.5 rounded-full cursor-grab active:cursor-grabbing touch-none shrink-0 border border-transparent hover:border-[#70308A] bg-[#F9FBFF] transition-colors"
                onMouseDown={() => setIsMoveActive(true)}
                onMouseUp={() => setIsMoveActive(false)}
                onMouseLeave={() => setIsMoveActive(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (dragHandleProps.onClick) dragHandleProps.onClick(e);
                }}
            >
                <Icon name="move" state={isMoveActive ? 'hover' : 'normal'} className="size-7" />
            </button>
        </Tooltip>
    );
};

export const LayerTitle = ({ name }) => (
    <span
        title={name}
        className="flex-1 min-w-0 block text-[14px] text-[#465055] font-garet font-medium whitespace-nowrap truncate pr-2"
    >
        {name}
    </span>
);

export const PinBadge = () => {
    return (
        <Tooltip content="Esta capa siempre se muestra arriba para no tapar etiquetas">
            <span className="p-1.5 rounded-full shrink-0 border border-transparent bg-[#F8F8F8] inline-flex items-center justify-center">
                <Icon name="hide" className="size-4" />
            </span>
        </Tooltip>
    );
};

const GEOMETRY_TYPES = {
    point: { icon: 'geom_point', label: 'Capa de puntos' },
    line: { icon: 'geom_line', label: 'Capa de líneas' },
    polygon: { icon: 'geom_polygon', label: 'Capa de polígonos' },
    raster: { icon: 'geom_raster', label: 'Capa ráster' }
};

const HEXBIN_BADGE = { icon: 'geom_hexbin', label: 'Agrupada en hexágonos' };

export const GeometryTypeBadge = ({ type, hexbin = false }) => {
    const geometry = hexbin ? HEXBIN_BADGE : GEOMETRY_TYPES[type];
    if (!geometry) return null;
    return (
        <Tooltip content={geometry.label}>
            <span
                aria-label={geometry.label}
                className="shrink-0 text-[#9E5200] inline-flex items-center justify-center"
            >
                <Icon name={geometry.icon} className="size-4" />
            </span>
        </Tooltip>
    );
};

export const EventoLayerIcon = ({ evento }) => {
    if (!evento?.iconoUrl) return null;
    const tooltipContent = (
        <div className="flex flex-col gap-0.5 leading-tight">
            <span className="font-semibold">{evento.titulo}</span>
            <span className="text-[11px] opacity-80">Capa que forma parte de este evento</span>
        </div>
    );
    return (
        <Tooltip content={tooltipContent}>
            <span className="shrink-0 inline-flex items-center justify-center">
                <img
                    src={evento.iconoUrl}
                    alt={evento.titulo || 'evento'}
                    loading="lazy"
                    decoding="async"
                    className="size-6 object-cover rounded"
                />
            </span>
        </Tooltip>
    );
};
