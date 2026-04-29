import { useMapsContext } from '@hooks/useMaps';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { useSider } from '@contexts/SiderContext';
import Loading from '@components/Loading';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { describeDateFilter, formatLoopLabel } from '@pages/maps/helpers/dateLoopHelpers';
import { LOOP_INTERVAL_PRESETS } from '@hooksMaps/useDateLoop';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import { handleKeyActivate } from '@utils/a11y';
import icoPauseNormal from '@assets/icons/ico_pause_normal.svg';
import icoPauseHover from '@assets/icons/ico_pause_hover.svg';
import icoPlayNormal from '@assets/icons/ico_play_normal.svg';
import icoPlayHover from '@assets/icons/ico_play_hover.svg';

import SlotBadge from './SlotBadge';

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
        toggleLoop,
        inferLoopConfig,
        getSpecificFilter,
        getLoopPrefs,
        setLoopIntervalMs,
        setLoopDirection,
        allLayers,
        compareMode,
        removeLayerFromSlot,
        toggleLayerVisibilityInSlot
    } = useMapsContext();

    const slotMembership = useMemo(() => {
        if (!compareMode?.active) return null;
        const inA = (compareMode.paneA?.activeLayerIds || []).includes(layer.id);
        const inB = (compareMode.paneB?.activeLayerIds || []).includes(layer.id);
        if (inA && inB) return 'AB';
        if (inA) return 'A';
        if (inB) return 'B';
        return null;
    }, [compareMode?.active, compareMode?.paneA?.activeLayerIds, compareMode?.paneB?.activeLayerIds, layer.id]);

    const { intervalMs: loopIntervalMs, direction: loopDirection } = getLoopPrefs?.(layer.id) || {};

    const itemRef = useRef(null);
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isMoveActive, setIsMoveActive] = useState(false);
    const isSelected = selectedLayerForSymbology?.id === layer.id;

    useEffect(() => {
        if (isSelected && itemRef.current) {
            itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isSelected]);
    const canOpenModal = layer.id !== 'curvas_de_nivel';

    const handleClickOnLayer = () => {
        setSelectedLayerForSymbology(layer);
    };

    const applyToMembership = (perSlotFn) => {
        if (slotMembership === 'A' || slotMembership === 'AB') perSlotFn('A');
        if (slotMembership === 'B' || slotMembership === 'AB') perSlotFn('B');
    };
    const handleRemoveClick = (e) => {
        e.stopPropagation();
        if (compareMode?.active && slotMembership) return applyToMembership(s => removeLayerFromSlot?.(layer.id, s));
        [layer.id, ...getAllChildLayerIds(layer.id)].forEach(id => clearLayerFilters(id));
        onToggleLayer(layer.id, false);
    };
    const handleToggleVisibilityClick = (e) => {
        e.stopPropagation();
        if (compareMode?.active && slotMembership) return applyToMembership(s => toggleLayerVisibilityInSlot?.(layer.id, s));
        toggleLayerVisibility(layer.id);
    };

    const handleSetSelectedLayerClick = (e) => {
        e.stopPropagation();
        setSelectedLayer(layer);
    };

    const loopState = getLoopState?.(layer.id);
    const isLooping = loopState?.isPlaying;

    const layerDef = useMemo(() => findLayerDef(layer.id, allLayers), [layer.id, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const dateFilter = getSpecificFilter?.(layer.id, 'date') || null;
    const { dateLabel, labelKind } = useMemo(() => {
        const desc = describeDateFilter({ filter: dateFilter, rasterPeriodicity });
        const label = formatLoopLabel(desc);
        let kind = null;
        if (desc) {
            if (desc.multi) kind = 'multi-year';
            else if (desc.annual || !desc.months?.length) kind = 'year';
            else if (desc.months.length === 1) kind = 'month-year';
            else kind = 'multi-month';
        }
        return { dateLabel: label, labelKind: kind };
    }, [dateFilter, rasterPeriodicity]);

    const LABEL_WIDTHS = {
        'year': 'w-[40px]',
        'month-year': 'w-[60px]',
        'multi-year': 'w-[50px]',
        'multi-month': 'w-[86px]'
    };
    const labelWidthClass = LABEL_WIDTHS[labelKind] || 'min-w-[48px]';

    const canPlayLoop = useMemo(() => {
        if (isLooping) return true;
        return inferLoopConfig?.(layer.id) != null;
    }, [isLooping, inferLoopConfig, layer.id]);

    const handleDateLabelClick = (e) => {
        e.stopPropagation();
        setSelectedLayer(layer);
    };

    const handlePlayClick = (e) => {
        e.stopPropagation();
        toggleLoop?.(layer.id);
    };

    const handleIntervalClick = (e) => {
        e.stopPropagation();
        const idx = LOOP_INTERVAL_PRESETS.indexOf(loopIntervalMs);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % LOOP_INTERVAL_PRESETS.length;
        setLoopIntervalMs?.(layer.id, LOOP_INTERVAL_PRESETS[nextIdx]);
    };

    const handleDirectionClick = (e) => {
        e.stopPropagation();
        setLoopDirection?.(layer.id, loopDirection === 'rtl' ? 'ltr' : 'rtl');
    };

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

            {(!isLoading || isLooping) && canOpenModal && (
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
            ref={itemRef}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            className={`
                group rounded-[7px] border border-transparent hover:border-[#EAEFFA]
                transition-all hover:shadow-sm cursor-pointer overflow-hidden
                ${isSelected ? 'bg-[#F7F0FA] ring-1 ring-[#70308A]' : layer.visible ? 'bg-white' : 'bg-[#EFF3FC]'}
            `}
            onClick={handleClickOnLayer}
            onKeyDown={handleKeyActivate(handleClickOnLayer)}
        >
            <Tooltip
                content={isSelected ? warningContent : null}
                variant="warning"
                placement={isMobile ? 'top' : 'left'}
                disabled={!isSelected}
            >
                <div className="flex items-center gap-3 px-2 py-4 h-12">
                    {dateLabel && layer.visible && (
                        <div className="flex items-center gap-1 shrink-0">
                            <Tooltip content="Ver detalles de capa">
                                <button
                                    onClick={handleDateLabelClick}
                                    className={`flex items-center justify-center h-[22px] px-2 rounded-full bg-[#FFF2E5] border border-[#FF8300] text-[#FF8300] text-[10px] font-garet font-bold shrink-0 hover:bg-[#FFE4C4] transition-all tabular-nums ${labelWidthClass} ${isLooping && isLoading ? 'animate-pulse' : ''}`}
                                >
                                    <span className="whitespace-nowrap">{dateLabel}</span>
                                </button>
                            </Tooltip>
                            <Tooltip content={isLooping ? 'Pausar animación' : 'Iniciar animación'}>
                                <button
                                    onClick={handlePlayClick}
                                    disabled={!canPlayLoop}
                                    className={`group/play items-center justify-center size-[22px] rounded-full bg-[#FFF2E5] border border-[#FF8300] hover:bg-[#FFE4C4] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${isLooping ? 'flex' : 'hidden md:group-hover:flex'}`}
                                >
                                    {isLooping ? (
                                        <>
                                            <img src={icoPauseNormal} alt="" className="size-[10px] block group-hover/play:hidden" />
                                            <img src={icoPauseHover} alt="" className="size-[10px] hidden group-hover/play:block" />
                                        </>
                                    ) : (
                                        <>
                                            <img src={icoPlayNormal} alt="" className="size-[10px] block group-hover/play:hidden" />
                                            <img src={icoPlayHover} alt="" className="size-[10px] hidden group-hover/play:block" />
                                        </>
                                    )}
                                </button>
                            </Tooltip>
                            <Tooltip content="Cambiar velocidad">
                                <button
                                    onClick={handleIntervalClick}
                                    className={`items-center justify-center size-[22px] rounded-full bg-[#F0EAF3] border border-[#703089] text-[#703089] text-[9px] font-garet font-bold tabular-nums hover:bg-[#E2D1EB] transition-colors shrink-0 ${isLooping ? 'flex' : 'hidden md:group-hover:flex'}`}
                                >
                                    {(loopIntervalMs / 1000).toString().replace(/^0(?=\.)/, '').replace(/\.?0+$/, '') || '0'}s
                                </button>
                            </Tooltip>
                            <Tooltip content={loopDirection === 'rtl' ? 'Dirección: derecha a izquierda' : 'Dirección: izquierda a derecha'}>
                                <button
                                    onClick={handleDirectionClick}
                                    className={`items-center justify-center size-[22px] rounded-full bg-[#F0EAF3] border border-[#703089] hover:bg-[#E2D1EB] transition-colors shrink-0 ${isLooping ? 'flex' : 'hidden md:group-hover:flex'}`}
                                >
                                    <Icon
                                        name="downArrow"
                                        className={`w-3 h-1.5 transition-transform duration-300 ${loopDirection === 'rtl' ? 'rotate-90' : '-rotate-90'}`}
                                    />
                                </button>
                            </Tooltip>
                        </div>
                    )}

                    {isLoading && !loopState && (
                        <div className="px-2 py-1 shrink-0">
                            <Loading visible={true} size={SIZE_BUTTON} border="border-2" />
                        </div>
                    )}

                    <div className="hidden md:group-hover:flex items-center gap-1 shrink-0">
                        {actionButtons}
                    </div>

                    {slotMembership && <SlotBadge membership={slotMembership} />}

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
