import { useContext, useCallback, useMemo, useEffect, useState, useRef } from 'react';
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
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';

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
        clearLayerFilters,
        getAllChildLayerIds,
        showAllLayers,
        hideAllLayers
    } = useMapsContext();
    const { isMobile } = useSider();

    const { unifiedLayers } = useActiveLayersLogic(activeLayerIds, hiddenLayerIds);
    const collapse = useLayerCollapse(unifiedLayers);
    useEffect(() => { onCollapseChange?.(collapse.isCollapsed); }, [collapse.isCollapsed, onCollapseChange]);
    const { handleDragEnd } = useLayerSorting(activeLayerIds, unifiedLayers, reorderActiveLayerIds);
    const sortableItems = useMemo(() => unifiedLayers.map(l => l.id), [unifiedLayers]);
    const isInegiMode = useMemo(() => activeLayerIds.some(id => ['limite_inegi', 'limite_municipal_inegi'].includes(id)), [activeLayerIds]);
    const isMobileSticky = isMobile ? STICKY_SIZE_MOBILE : STICKY_SIZE;

    const allHidden = useMemo(() => {
        return activeLayerIds.length > 0 && activeLayerIds.every(id => hiddenLayerIds.includes(id));
    }, [activeLayerIds, hiddenLayerIds]);

    const handleToggleBaseMode = useCallback(() => {
        if (isInegiMode) {
            ['limite_inegi', 'limite_municipal_inegi'].forEach(id => onToggleLayer(id, false, true));
            ['regiones', 'limite_municipal', 'limite_iieg'].forEach(id => onToggleLayer(id, true, true));
        } else {
            ['limite_iieg', 'limite_municipal', 'regiones'].forEach(id => onToggleLayer(id, false, true));
            ['limite_municipal_inegi', 'limite_inegi'].forEach(id => onToggleLayer(id, true, true));
        }
    }, [isInegiMode, onToggleLayer]);

    const handleRemoveAll = useCallback(() => {
        activeLayerIds.forEach(id => {
            const childIds = getAllChildLayerIds(id);
            [id, ...childIds].forEach(cid => clearLayerFilters(cid));
            onToggleLayer(id, false);
        });
    }, [activeLayerIds, getAllChildLayerIds, clearLayerFilters, onToggleLayer]);

    const handleToggleVisibilityAll = useCallback(() => {
        if (allHidden) {
            showAllLayers();
        } else {
            hideAllLayers();
        }
    }, [allHidden, showAllLayers, hideAllLayers]);

    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const deleteDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(e.target)) setShowDeleteConfirm(false);
        };
        if (showDeleteConfirm) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDeleteConfirm]);

    if (collapse.isCollapsed) {
        return (
            <div className={`w-auto flex items-center justify-end pt-1 pl-1`}>
                <Tooltip content={unifiedLayers.length > 0 ? 'Expandir capas activas' : 'No hay capas activas'}>
                    <button
                        onClick={() => (unifiedLayers.length > 0 || collapse.isManuallyCollapsed) && collapse.handleExpand()}
                        className={`size-12.5 flex items-center justify-center bg-[#EAEFFA] rounded-full transition-colors relative ${(unifiedLayers.length > 0 || collapse.isManuallyCollapsed) ? 'hover:bg-[#F2EBFF] hover:border-[#5C2472] hover:border cursor-pointer' : 'cursor-default opacity-50'}`}
                        disabled={unifiedLayers.length === 0 && !collapse.isManuallyCollapsed}
                    >
                        <Icon name="capa_activa" className="size-10" />
                        <Badge visible={unifiedLayers.length > 0} count={unifiedLayers.length} className="absolute -top-1 -left-1" />
                    </button>
                </Tooltip>
            </div>
        );
    }

    return (
        <div className="w-auto px-4.5 pb-6 pt-2 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] flex-1 min-h-0 flex flex-col">
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

            {activeLayerIds.length > 0 && (
                <div className="flex items-center justify-between shrink-0 mb-2 gap-1.5">
                    <div className="flex items-center gap-3 shrink md:shrink-0 min-w-0">
                        <div className="group/vis flex items-center gap-1 cursor-pointer shrink md:shrink-0" onClick={handleToggleVisibilityAll}>
                            <span className="p-0.5 rounded-full border border-transparent group-hover/vis:border-[#70308A] transition-colors">
                                <Icon name="visible" state={allHidden ? 'hover' : 'gray'} className="size-5 shrink-0" />
                            </span>
                            <span className="text-[7.5px] md:text-[8px] font-garet font-medium text-[#465055] whitespace-nowrap truncate leading-none pt-[1.5px]">{allHidden ? 'Mostrar mis capas' : 'Ocultar mis capas'}</span>
                        </div>

                        <div className="relative shrink md:shrink-0" ref={deleteDropdownRef}>
                            <div
                                onClick={() => setShowDeleteConfirm(p => !p)}
                                onMouseEnter={() => setIsDeleteHovered(true)}
                                onMouseLeave={() => setIsDeleteHovered(false)}
                                className="group/del flex items-center gap-1 cursor-pointer"
                            >
                                <span className="p-0.5 rounded-full border border-transparent group-hover/del:border-[#FF577D] transition-colors">
                                    <Icon name="eliminar" state={isDeleteHovered ? 'hover' : 'normal'} className="size-5 shrink-0" />
                                </span>
                                <span className="text-[7.5px] md:text-[8px] font-garet font-medium text-[#465055] group-hover/del:text-[#FF577D] whitespace-nowrap truncate leading-none pt-[1.5px] transition-colors">Eliminar mis capas</span>
                            </div>
                            {showDeleteConfirm && (
                                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-[8px] shadow-[0px_3px_24px_#00000029] w-[342px] p-4">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="absolute top-3 right-3 cursor-pointer"
                                    >
                                        <Icon name="cerrarModal" className="size-7" />
                                    </button>
                                    <div className="flex gap-3 pr-3 pt-5">
                                        <Icon name="warning_dropdown" className="size-8 shrink-0" />
                                        <div>
                                            <p className="text-[12px]/[18px] font-garet font-bold text-[#2E4372]">
                                                ¿Estás seguro de borrar todas las capas que tienes activas? 
                                            </p>
                                            <p className="text-[12px]/[18px] font-garet font-medium text-[#2E4372]">
                                                Si las borras deberás activar una por una nuevamente
                                            </p>
                                            <button
                                                onClick={() => { handleRemoveAll(); setShowDeleteConfirm(false); }}
                                                className="mt-3 py-[7px] px-4 rounded-[30px] bg-[#FF577D] text-white text-[12px] font-garet font-bold cursor-pointer hover:bg-[#e84d6f] transition-colors"
                                            >
                                                Sí. Quiero borrar todas las capas
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <Switch
                            checked={!isInegiMode}
                            onChange={handleToggleBaseMode}
                            onLabel="IIEG"
                            offLabel="INEGI"
                            onColor="#70308A"
                            offColor="#FF8300"
                            tooltip={isInegiMode ? 'Cambiar a IIEG' : 'Cambiar a INEGI'}
                        />
                    </div>
                </div>
            )}

            <ScrollContainer className="flex-1 min-h-0 -mx-0 px-1" overlayFade stickySize={isMobileSticky}>
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
