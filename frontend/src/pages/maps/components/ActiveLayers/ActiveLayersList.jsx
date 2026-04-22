import { useContext, useCallback, useMemo, useEffect, useState } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useActiveLayersLogic } from '../../hooks/useActiveLayersLogic';
import { useLayerCollapse } from './hooks/useLayerCollapse';
import { useLayerSorting } from './hooks/useLayerSorting';
import { SortableList, SortableItem } from './SortableList';
import ActiveLayerItem from './ActiveLayerItem';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import Switch from '@components/Switch';
import ScrollContainer from '@components/ScrollContainer';
import ConfirmDropdown from '@components/ConfirmDropdown';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { getDefaultMapView } from '@pages/maps/helpers/defaultView';

const STICKY_SIZE = 52;
const STICKY_SIZE_MOBILE = 100;

const ActiveLayersList = ({ onCollapseChange }) => {
    const {
        activeLayerIds,
        onToggleLayer,
        reorderActiveLayerIds,
        hiddenLayerIds
    } = useContext(MapsContext);
    const {
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        clearLayerFilters,
        getAllChildLayerIds,
        showAllLayers,
        hideAllLayers,
        mapRef,
        hasActiveLoops,
        pauseAllLoops,
        dateLoops
    } = useMapsContext();
    const { isMobile } = useSider();

    const { unifiedLayers } = useActiveLayersLogic(activeLayerIds, hiddenLayerIds);
    const collapse = useLayerCollapse(unifiedLayers);
    useEffect(() => { onCollapseChange?.(collapse.isCollapsed); }, [collapse.isCollapsed, onCollapseChange]);
    const { handleDragEnd } = useLayerSorting(activeLayerIds, unifiedLayers, reorderActiveLayerIds);
    const sortableItems = useMemo(() => unifiedLayers.map(l => l.id), [unifiedLayers]);
    const isInegiMode = useMemo(() => activeLayerIds.some(id => ['limite_inegi', 'limite_municipal_inegi'].includes(id)), [activeLayerIds]);
    const isMobileSticky = isMobile ? STICKY_SIZE_MOBILE : STICKY_SIZE;

    const noLayers = activeLayerIds.length === 0;

    const allHidden = useMemo(() => {
        return activeLayerIds.length > 0 && activeLayerIds.every(id => hiddenLayerIds.includes(id));
    }, [activeLayerIds, hiddenLayerIds]);

    const visibilityCount = useMemo(() => {
        if (allHidden) return activeLayerIds.length;
        return activeLayerIds.filter(id => !hiddenLayerIds.includes(id)).length;
    }, [activeLayerIds, hiddenLayerIds, allHidden]);

    const activeLoopsCount = useMemo(() => {
        return Object.values(dateLoops || {}).filter(l => l?.isPlaying).length;
    }, [dateLoops]);

    const handleToggleBaseMode = useCallback(() => {
        if (activeLayerIds.length === 0) {
            ['limite_iieg', 'limite_municipal', 'regiones'].forEach(id => onToggleLayer(id, true, true));
            return;
        }
        if (isInegiMode) {
            ['limite_inegi', 'limite_municipal_inegi'].forEach(id => onToggleLayer(id, false, true));
            ['regiones', 'limite_municipal', 'limite_iieg'].forEach(id => onToggleLayer(id, true, true));
        } else {
            ['limite_iieg', 'limite_municipal', 'regiones'].forEach(id => onToggleLayer(id, false, true));
            ['limite_municipal_inegi', 'limite_inegi'].forEach(id => onToggleLayer(id, true, true));
        }
    }, [activeLayerIds.length, isInegiMode, onToggleLayer]);

    const handleRemoveAll = useCallback(() => {
        activeLayerIds.forEach(id => {
            const childIds = getAllChildLayerIds(id);
            [id, ...childIds].forEach(cid => clearLayerFilters(cid));
            onToggleLayer(id, false);
        });
        setSelectedLayerForSymbology(null);
        if (mapRef?.current) {
            const { center, zoom } = getDefaultMapView();
            mapRef.current.getView().animate({ center, zoom, duration: 500 });
        }
    }, [activeLayerIds, getAllChildLayerIds, clearLayerFilters, onToggleLayer, setSelectedLayerForSymbology, mapRef]);

    const handleToggleVisibilityAll = useCallback(() => {
        if (allHidden) {
            showAllLayers();
        } else {
            hideAllLayers();
        }
    }, [allHidden, showAllLayers, hideAllLayers]);

    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const visibleHeaderButtons = 2 + (hasActiveLoops ? 1 : 0);
    const hideHeaderLabels = visibleHeaderButtons > 2;

    if (collapse.isCollapsed) {
        return (
            <div className={`w-auto flex items-center justify-end pt-1 pl-1`}>
                <Tooltip content={unifiedLayers.length > 0 ? 'Expandir capas activas' : 'No hay capas activas'}>
                    <button
                        onClick={collapse.handleExpand}
                        className="size-12.5 flex items-center justify-center bg-[#EAEFFA] rounded-full transition-colors relative hover:bg-[#F2EBFF] hover:border-[#5C2472] hover:border cursor-pointer max-md:pointer-events-auto"
                    >
                        <Icon name="capa_activa" className="size-10" />
                        <Badge visible={unifiedLayers.length > 0} count={unifiedLayers.length} className="absolute -top-1 -left-1" />
                    </button>
                </Tooltip>
            </div>
        );
    }

    return (
        <div className="w-auto px-4.5 pb-6 pt-2 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] flex-1 min-h-0 flex flex-col max-md:pointer-events-auto">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Icon name="capa_activa" className="size-8" />
                    <h3 className="font-garet font-bold text-[18px]/[47px]">Capas Activas</h3>
                </div>

                <Tooltip content="Colapsar capas activas">
                    <button onClick={collapse.handleManualCollapse} className="cursor-pointer">
                        <Icon name="zoomout" className="size-6" />
                    </button>
                </Tooltip>
            </div>

            <div className="flex items-center justify-between shrink-0 mb-2 gap-1.5">
                <div className="flex items-center gap-2 md:gap-3 shrink md:shrink-0 min-w-0">
                    <button
                        type="button"
                        disabled={noLayers}
                        className={`group/vis flex items-center gap-1 shrink-0 ${noLayers ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        onClick={handleToggleVisibilityAll}
                    >
                        <span className={`relative p-0.5 rounded-full border border-transparent transition-colors ${noLayers ? '' : 'group-hover/vis:border-[#70308A]'}`}>
                            <Icon name="visible" state={allHidden ? 'hover' : 'gray'} className="size-5 shrink-0" />
                            <Badge
                                visible={visibilityCount > 0}
                                count={visibilityCount}
                                color="purple"
                                size="sm"
                                className="absolute -top-1 -right-1 pointer-events-none"
                            />
                        </span>
                        <span className={`${hideHeaderLabels ? 'hidden' : 'inline'} text-[8px] font-garet font-medium text-[#465055] whitespace-nowrap truncate leading-none pt-[1.5px]`}>{allHidden ? 'Mostrar mis capas' : 'Ocultar mis capas'}</span>
                    </button>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            disabled={noLayers}
                            onClick={() => setShowDeleteConfirm(p => !p)}
                            onMouseEnter={() => !noLayers && setIsDeleteHovered(true)}
                            onMouseLeave={() => !noLayers && setIsDeleteHovered(false)}
                            className={`group/del flex items-center gap-1 ${noLayers ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <span className={`relative p-0.5 rounded-full border border-transparent transition-colors ${noLayers ? '' : 'group-hover/del:border-[#FF577D]'}`}>
                                <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className="size-5 shrink-0" />
                                <Badge
                                    visible={activeLayerIds.length > 0}
                                    count={activeLayerIds.length}
                                    color="pink"
                                    size="sm"
                                    className="absolute -top-1 -right-1 pointer-events-none"
                                />
                            </span>
                            <span className={`${hideHeaderLabels ? 'hidden' : 'inline'} text-[8px] font-garet font-medium whitespace-nowrap truncate leading-none pt-[1.5px] transition-colors ${noLayers ? 'text-[#465055]' : 'text-[#FF577D]'}`}>Eliminar mis capas</span>
                        </button>
                        <ConfirmDropdown
                            open={showDeleteConfirm}
                            onClose={() => setShowDeleteConfirm(false)}
                            onConfirm={handleRemoveAll}
                            title="¿Estás seguro de borrar todas las capas que tienes activas?"
                            description="Si las borras deberás activar una por una nuevamente"
                            confirmText="Sí. Quiero borrar todas las capas"
                            className="right-0 md:right-0 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0"
                        />
                    </div>

                    {hasActiveLoops && (
                        <button
                            type="button"
                            className="group/pauseall flex items-center gap-1 shrink-0 cursor-pointer"
                            onClick={pauseAllLoops}
                        >
                            <span className="relative p-0.5 rounded-full border border-transparent transition-colors group-hover/pauseall:border-[#FF8300]">
                                <span className="size-5 flex items-center justify-center text-[#5C2472] group-hover/pauseall:text-[#FF8300] transition-colors">
                                    <svg viewBox="0 0 12 14" fill="currentColor" className="size-3 shrink-0">
                                        <rect x="1" y="1" width="3" height="12" rx="1" />
                                        <rect x="8" y="1" width="3" height="12" rx="1" />
                                    </svg>
                                </span>
                                <Badge
                                    visible={activeLoopsCount > 0}
                                    count={activeLoopsCount}
                                    color="orange"
                                    size="sm"
                                    className="absolute -top-1 -right-1 pointer-events-none"
                                />
                            </span>
                            <span className={`${hideHeaderLabels ? 'hidden' : 'inline'} text-[8px] font-garet font-medium whitespace-nowrap truncate leading-none pt-[1.5px] text-[#FF8300]`}>Pausar animaciones</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <Switch
                        checked={!isInegiMode}
                        onChange={handleToggleBaseMode}
                        onLabel="IIEG"
                        offLabel="INEGI"
                        onColor={noLayers ? '#d1d5db' : '#70308A'}
                        offColor="#FF8300"
                        tooltip={noLayers ? 'Activar capas IIEG' : (isInegiMode ? 'Cambiar a IIEG' : 'Cambiar a INEGI')}
                    />
                </div>
            </div>

            <ScrollContainer
                className="flex-1 min-h-0 -mx-0 px-1"
                overlayFade
                stickySize={isMobileSticky}
                clickableArrows
                minItemsForClick={5}
                itemCount={unifiedLayers.length}
            >
                <SortableList
                    items={sortableItems}
                    onSortEnd={handleDragEnd}
                >
                    <div className="space-y-1 py-1">
                        {unifiedLayers.map((layer) => (
                            <SortableItem key={layer.id} id={layer.id} isSticky={selectedLayerForSymbology?.id === layer.id}>
                                <ActiveLayerItem layer={layer} />
                            </SortableItem>
                        ))}
                    </div>
                </SortableList>
            </ScrollContainer>
        </div>
    );
};

export default ActiveLayersList;
