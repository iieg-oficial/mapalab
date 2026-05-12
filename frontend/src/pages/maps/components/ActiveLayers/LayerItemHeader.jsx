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
    const [isHover, setIsHover] = useState(false);
    return (
        <Tooltip content="Esta capa siempre se muestra arriba para no tapar etiquetas">
            <span
                className="p-0.5 rounded-full shrink-0 border border-transparent bg-[#F9FBFF] inline-flex"
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
            >
                <Icon name="pin" state={isHover ? 'hover' : 'normal'} className="size-7" />
            </span>
        </Tooltip>
    );
};
