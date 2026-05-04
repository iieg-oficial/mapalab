import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const SIZE = 'size-5';
const BTN = 'p-1 rounded-full transition-colors cursor-pointer border border-transparent bg-[#F9FBFF] shrink-0';

const LayerInlineActions = ({ visible, isLoading, isLooping, canOpenModal, onToggleVisibility, onOpenDetails, onRemove, slotMembership = null, activeSlot = null }) => {
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);

    const targetSlot = slotMembership === 'AB' ? activeSlot : slotMembership;
    const otherSlot = activeSlot === 'A' ? 'B' : 'A';
    const sideTag = targetSlot ? ` del lado ${targetSlot}` : '';
    const ABWarning = slotMembership === 'AB' ? ` (seguirá en el lado ${otherSlot})` : '';

    return (
        <div className="flex items-center gap-1 shrink-0">
            <Tooltip content={`${visible ? 'Ocultar' : 'Mostrar'} capa${sideTag}${visible ? ABWarning : ''}`}>
                <button className={`${BTN} hover:border-[#70308A]`} onClick={onToggleVisibility}>
                    <Icon name="visible" state={visible ? 'normal' : 'hover'} className={SIZE} />
                </button>
            </Tooltip>
            {(!isLoading || isLooping) && canOpenModal && (
                <Tooltip content="Ver detalles de capa">
                    <button
                        className={`${BTN} hover:border-[#70308A]`}
                        onClick={onOpenDetails}
                        onMouseEnter={() => setIsCardHovered(true)}
                        onMouseLeave={() => setIsCardHovered(false)}
                    >
                        <Icon name="big_card" state={isCardHovered ? 'hover' : 'normal'} className={SIZE} />
                    </button>
                </Tooltip>
            )}
            <Tooltip content="Eliminar capa">
                <button
                    className={`${BTN} hover:border-[#FF577D]`}
                    onClick={onRemove}
                    onMouseEnter={() => setIsDeleteHovered(true)}
                    onMouseLeave={() => setIsDeleteHovered(false)}
                >
                    <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className={SIZE} />
                </button>
            </Tooltip>
        </div>
    );
};

export default LayerInlineActions;
