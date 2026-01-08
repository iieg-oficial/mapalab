import { useMapsContext } from '@hooks/useMaps';
import Loading from '@components/Loading';
import { useMemo, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const SIZE_BUTTON = 'size-5';

const ActiveLayerItem = ({
    layer,
    dragHandleProps
}) => {
    const {
        loadingLayers,
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        onToggleLayer,
        clearLayerFilters,
        getAllChildLayerIds,
        toggleLayerVisibility,
        setSelectedLayer
    } = useMapsContext();

    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isMoveActive, setIsMoveActive] = useState(false);
    const isSelected = selectedLayerForSymbology?.id === layer.id;
    const canOpenModal = layer.hasChildren !== false;

    const handleClickOnLayer = (e) => {
        e.stopPropagation();
        setSelectedLayerForSymbology(layer);
    };

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        const childIds = getAllChildLayerIds(layer.id);
        const allIds = [layer.id, ...childIds];
        allIds.forEach(id => clearLayerFilters(id));
        onToggleLayer(layer.id, false);
    };

    const handleToggleVisibilityClick = (e) => {
        e.stopPropagation();
        toggleLayerVisibility(layer.id);
    };

    const handleSetSelectedLayerClick = (e) => {
        e.stopPropagation();
        setSelectedLayer(layer);
    };

    const isLoading = useMemo(() => {
        if (loadingLayers.has(layer.id)) return true;
        if (layer.childIds) {
            return layer.childIds.some(id => loadingLayers.has(id));
        }
        return false;
    }, [loadingLayers, layer.id, layer.childIds]);

    return (
        <div
            className={`
                group flex items-center gap-3 px-2 py-4 rounded-[10px] border border-transparent hover:border-[#EAEFFA] 
                transition-all relative h-12 overflow-hidden
                ${layer.visible ? 'bg-white' : 'bg-[#EBEBEB]'}
                ${isSelected ? 'ring-1 ring-[#70308A]' : ''}
            `}
        >
            {isLoading && (
                <div className="px-2 py-1 shrink-0">
                    <Loading visible={true} size={SIZE_BUTTON} border="border-2" />
                </div>
            )}

            <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                <Tooltip content={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}>
                    <button
                        className="p-1.5 rounded-full transition-colors cursor-pointer border border-transparent hover:border-[#70308A] bg-[#F9FBFF]"
                        onClick={handleToggleVisibilityClick}
                    >
                        <Icon
                            name={layer.visible ? 'mostrar' : 'ocultar'}
                            className={SIZE_BUTTON}
                        />
                    </button>
                </Tooltip>

                {dragHandleProps && (
                    <Tooltip content="Reordenar capa">
                        <button
                            {...dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1.5 rounded-full touch-none"
                            onMouseDown={() => setIsMoveActive(true)}
                            onMouseUp={() => setIsMoveActive(false)}
                            onMouseLeave={() => setIsMoveActive(false)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (dragHandleProps.onClick) dragHandleProps.onClick(e);
                            }}
                        >
                            <Icon name="move" state={isMoveActive ? 'hover' : 'normal'} className="size-8" />
                        </button>
                    </Tooltip>
                )}

                {!isLoading && canOpenModal && (
                    <Tooltip content="Ver detalles de capa">
                        <button
                            className="p-1.5 rounded-full cursor-pointer border border-transparent hover:border-[#70308A] transition-colors bg-[#F9FBFF]"
                            onClick={handleSetSelectedLayerClick}
                            onMouseEnter={() => setIsCardHovered(true)}
                            onMouseLeave={() => setIsCardHovered(false)}
                        >
                            <Icon name="big_card" state={isCardHovered ? 'hover' : 'normal'} className={SIZE_BUTTON} />
                        </button>
                    </Tooltip>
                )}

                <Tooltip content="Eliminar capa">
                    <button
                        className="p-1.5 rounded-full cursor-pointer border border-transparent hover:border-[#FF577D] transition-colors bg-[#F9FBFF]"
                        onClick={handleRemoveClick}
                        onMouseEnter={() => setIsDeleteHovered(true)}
                        onMouseLeave={() => setIsDeleteHovered(false)}
                    >
                        <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className={SIZE_BUTTON} />
                    </button>
                </Tooltip>
            </div>

            <Tooltip content={layer.name}>
                <span
                    className="text-[14px]/[16px] font-garet font-medium flex-1 min-w-0 truncate cursor-pointer"
                    onClick={handleClickOnLayer}
                >
                    {layer.name}
                </span>
            </Tooltip>
        </div>
    );
};

export default ActiveLayerItem;
