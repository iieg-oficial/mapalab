import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import Badge from '@components/Badge';

const HistoryButton = ({
    count = 0,
    onClick,
    buttonRef,
    isOpen,
    className = ''
}) => {
    const [isHovered, setIsHovered] = useState(false);

    if (count <= 0) return null;

    const iconState = isHovered ? 'hover' : 'normal';

    return (
        <Tooltip content="Ver lista de mediciones" placement="right" delay={500}>
            <button
                ref={buttonRef}
                type="button"
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={[
                    'relative flex items-center justify-center p-1 rounded-full border border-transparent',
                    'bg-[#EAEFFA] hover:border-[#F2EBFF] active:bg-[#5C2472] transition-all',
                    className
                ].join(' ')}
                aria-label={`Ver lista de mediciones (${count})`}
            >
                <Icon name="mediciones" state={iconState} className="w-10 h-10" />
                <Badge visible={!isOpen} count={count} className="absolute -top-1 -right-1" />
            </button>
        </Tooltip>
    );
};

export default HistoryButton;
