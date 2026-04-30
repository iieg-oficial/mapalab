import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const SIZE_BUTTON = 'size-5';
const BUTTON_BASE = 'p-1.5 rounded-full transition-colors cursor-pointer border border-transparent bg-[#F9FBFF]';

const LayerActionsBar = ({
    visible,
    isLoading,
    isLooping,
    canOpenModal,
    onToggleVisibility,
    onOpenDetails,
    onRemove
}) => {
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);

    return (
        <div className="flex items-center gap-1 w-full">
            <Tooltip content={visible ? 'Ocultar capa' : 'Mostrar capa'}>
                <button
                    className={`${BUTTON_BASE} hover:border-[#70308A]`}
                    onClick={onToggleVisibility}
                >
                    <Icon
                        name="visible"
                        state={visible ? 'normal' : 'hover'}
                        className={SIZE_BUTTON}
                    />
                </button>
            </Tooltip>

            {(!isLoading || isLooping) && canOpenModal && (
                <Tooltip content="Ver detalles de capa">
                    <button
                        className={`${BUTTON_BASE} hover:border-[#70308A]`}
                        onClick={onOpenDetails}
                        onMouseEnter={() => setIsCardHovered(true)}
                        onMouseLeave={() => setIsCardHovered(false)}
                    >
                        <Icon name="big_card" state={isCardHovered ? 'hover' : 'normal'} className={SIZE_BUTTON} />
                    </button>
                </Tooltip>
            )}

            <div className="flex-1" />

            <Tooltip content="Eliminar capa">
                <button
                    className={`${BUTTON_BASE} hover:border-[#FF577D]`}
                    onClick={onRemove}
                    onMouseEnter={() => setIsDeleteHovered(true)}
                    onMouseLeave={() => setIsDeleteHovered(false)}
                >
                    <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className={SIZE_BUTTON} />
                </button>
            </Tooltip>
        </div>
    );
};

export default LayerActionsBar;
