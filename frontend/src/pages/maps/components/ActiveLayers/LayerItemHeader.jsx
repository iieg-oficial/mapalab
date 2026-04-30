import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const LayerItemHeader = ({ name, showHandle: showHandleProp, dragHandleProps }) => {
    const [isMoveActive, setIsMoveActive] = useState(false);
    const showHandle = showHandleProp && dragHandleProps;

    return (
        <div className="flex items-center gap-2 min-w-0 flex-1">
            {showHandle && (
                <Tooltip content="Reordenar capa">
                    <button
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing rounded-full touch-none shrink-0"
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
            )}
            <div className="flex-1 min-w-0">
                <Tooltip content={name} disableMobile>
                    <span className="text-[14px] text-[#465055] font-garet font-medium block whitespace-nowrap truncate pr-2">
                        {name}
                    </span>
                </Tooltip>
            </div>
        </div>
    );
};

export default LayerItemHeader;
