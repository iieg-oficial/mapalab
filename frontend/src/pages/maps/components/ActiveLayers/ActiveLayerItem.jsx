import { useMapsContext } from '@hooks/useMaps';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { useSider } from '@contexts/SiderContext';
import Loading from '@components/Loading';
import { useMemo, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import { HIDDEN_SCROLLBAR } from '@constants/global';

const SIZE_BUTTON = 'size-5';

const ActiveLayerItem = ({
    layer,
    dragHandleProps
}) => {
    const { loadingLayers } = useLayerLoading();
    const { isMobile } = useSider();
    const {
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        onToggleLayer,
        clearLayerFilters,
        getAllChildLayerIds,
        toggleLayerVisibility,
        setSelectedLayer,
        getLoopState,
        toggleLoop
    } = useMapsContext();

    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isMoveActive, setIsMoveActive] = useState(false);
    const isSelected = selectedLayerForSymbology?.id === layer.id;
    const canOpenModal = layer.id !== 'curvas_de_nivel';

    const handleClickOnLayer = () => {
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

    const loopState = getLoopState?.(layer.id);
    const isLooping = loopState?.isPlaying;
    const loopMonth = loopState?.currentMonth;
    const monthAbbr = loopMonth != null
        ? MONTHS.find(m => m.num === loopMonth)?.name.slice(0, 3).toUpperCase()
        : null;

    const isLoading = useMemo(() => {
        if (loadingLayers.has(layer.id)) return true;
        if (layer.childIds) {
            return layer.childIds.some(id => loadingLayers.has(id));
        }
        return false;
    }, [loadingLayers, layer.id, layer.childIds]);

    const actionButtons = (
        <>
            <Tooltip content={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}>
                <button
                    className="p-1.5 rounded-full transition-colors cursor-pointer border border-transparent hover:border-[#70308A] bg-[#F9FBFF]"
                    onClick={handleToggleVisibilityClick}
                >
                    <Icon
                        name='visible'
                        state={layer.visible ? 'normal' : 'hover'}
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
        </>
    );

    const warningContent = 'Al seleccionar un punto en el mapa, éste mostrará información de esta capa. Puedes cambiar la selección dando clic en la capa que necesites visualizar.';

    return (
        <div
            className={`
                group rounded-[7px] border border-transparent hover:border-[#EAEFFA]
                transition-all hover:shadow-sm cursor-pointer overflow-hidden
                ${isSelected ? 'bg-[#F7F0FA] ring-1 ring-[#70308A]' : layer.visible ? 'bg-white' : 'bg-[#EFF3FC]'}
            `}
            onClick={handleClickOnLayer}
        >
            <Tooltip
                content={isSelected ? warningContent : null}
                variant="warning"
                placement={isMobile ? 'top' : 'left'}
                disabled={!isSelected}
            >
                <div className="flex items-center gap-3 px-2 py-4 h-12">
                    {loopState && monthAbbr && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleLoop?.(layer.id); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#F0EAF3] text-[#465055] text-[14px] font-garet font-medium shrink-0 hover:bg-[#E5DAE9] transition-colors"
                        >
                            {isLooping ? (
                                <svg width="10" height="10" viewBox="0 0 12 12">
                                    <rect x="1" y="1" width="3.5" height="10" rx="1" fill="currentColor" />
                                    <rect x="7.5" y="1" width="3.5" height="10" rx="1" fill="currentColor" />
                                </svg>
                            ) : (
                                <svg width="10" height="10" viewBox="0 0 12 12">
                                    <path d="M2 1.5v9l8.5-4.5L2 1.5z" fill="currentColor" />
                                </svg>
                            )}
                            {monthAbbr}
                        </button>
                    )}

                    {isLoading && !loopState && (
                        <div className="px-2 py-1 shrink-0">
                            <Loading visible={true} size={SIZE_BUTTON} border="border-2" />
                        </div>
                    )}

                    <div className="hidden md:group-hover:flex items-center gap-1 shrink-0">
                        {actionButtons}
                    </div>

                    <div className={`flex-1 min-w-0 pr-2 ${HIDDEN_SCROLLBAR}`}>
                        <Tooltip content={layer.name} disableMobile>
                            <span
                                className="text-[14px] text-[#465055] font-garet font-medium block whitespace-nowrap pr-6"
                            >
                                {layer.name}
                            </span>
                        </Tooltip>
                    </div>

                </div>

            </Tooltip>

            {isSelected && (
                <div className="md:hidden flex items-center gap-1 px-2 pb-2">
                    {actionButtons}
                </div>
            )}
        </div>
    );
};

export default ActiveLayerItem;
