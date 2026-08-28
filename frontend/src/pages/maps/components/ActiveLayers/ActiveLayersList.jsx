import { useContext, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import MapsContext from '@contexts/MapsContext';
import { useActiveLayersLogic } from '../../hooks/useActiveLayersLogic';
import { useAlwaysOnTopPinning, sortItemsWithPinnedFirst } from '../../hooks/useAlwaysOnTopPinning';
import { useLayerCollapse } from './hooks/useLayerCollapse';
import { useLayerSorting } from './hooks/useLayerSorting';
import { LegendsVisibilityProvider } from './hooks/useLegendsVisibility';
import { StatsVisibilityProvider } from './hooks/useStatsVisibility';
import { SortableList, SortableItem } from './SortableList';
import ActiveLayerItem from './ActiveLayerItem';
import ActiveLayersToolbar from './ActiveLayersToolbar';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import ScrollContainer from '@components/ScrollContainer';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { resolveSelectedLayerLabel } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { getDefaultMapView } from '@pages/maps/helpers/defaultView';
import { isInegiBaseMode } from '@pages/maps/helpers/basemaps';

const ActiveLayersListInner = ({ onCollapseChange }) => {
    const {
        activeLayerIds,
        onToggleLayer,
        reorderActiveLayerIds,
        hiddenLayerIds,
        compareMode
    } = useContext(MapsContext);
    const {
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        clearLayerFilters,
        getAllChildLayerIds,
        showAllLayers,
        setHiddenLayerIds,
        soloSeleccionada,
        setSoloSeleccionada,
        mapRef,
        hasActiveLoops,
        pauseAllLoops,
        dateLoops,
        reorderInSlots
    } = useMapsContext();

    const isSwipe = !!compareMode?.active;
    const effectiveActiveLayerIds = useMemo(() => {
        if (!isSwipe) return activeLayerIds;
        const paneAIds = compareMode.paneA?.activeLayerIds || [];
        const paneBIds = compareMode.paneB?.activeLayerIds || [];
        const allIds = new Set([...paneAIds, ...paneBIds]);
        const order = compareMode.globalOrder || [];
        const seen = new Set();
        const result = [];
        order.forEach(id => {
            if (allIds.has(id) && !seen.has(id)) { seen.add(id); result.push(id); }
        });
        [...paneAIds, ...paneBIds].forEach(id => {
            if (!seen.has(id)) { seen.add(id); result.push(id); }
        });
        return result;
    }, [isSwipe, activeLayerIds, compareMode?.paneA?.activeLayerIds, compareMode?.paneB?.activeLayerIds, compareMode?.globalOrder]);

    const effectiveHiddenLayerIds = useMemo(() => {
        if (!isSwipe) return hiddenLayerIds;
        const activeA = new Set(compareMode.paneA?.activeLayerIds || []);
        const activeB = new Set(compareMode.paneB?.activeLayerIds || []);
        const hiddenA = new Set(compareMode.paneA?.hiddenLayerIds || []);
        const hiddenB = new Set(compareMode.paneB?.hiddenLayerIds || []);
        const activeSlot = compareMode.activeSlot;
        const result = [];
        effectiveActiveLayerIds.forEach(id => {
            const inA = activeA.has(id);
            const inB = activeB.has(id);
            let isHidden = false;
            if (inA && inB) isHidden = activeSlot === 'A' ? hiddenA.has(id) : hiddenB.has(id);
            else if (inA) isHidden = hiddenA.has(id);
            else if (inB) isHidden = hiddenB.has(id);
            if (isHidden) result.push(id);
        });
        return result;
    }, [isSwipe, hiddenLayerIds, compareMode?.paneA, compareMode?.paneB, compareMode?.activeSlot, effectiveActiveLayerIds]);

    const { unifiedLayers: rawUnifiedLayers } = useActiveLayersLogic(effectiveActiveLayerIds, effectiveHiddenLayerIds);
    const pinnedLayerIds = useAlwaysOnTopPinning({
        activeLayerIds: effectiveActiveLayerIds,
        hiddenLayerIds: effectiveHiddenLayerIds,
        compareModeActive: isSwipe
    });
    const { layers: layerTreeNodes, initialOrder } = useLayers();
    const unifiedLayers = useMemo(
        () => sortItemsWithPinnedFirst(rawUnifiedLayers, pinnedLayerIds, initialOrder),
        [rawUnifiedLayers, pinnedLayerIds, initialOrder]
    );
    const collapse = useLayerCollapse(unifiedLayers);
    useEffect(() => { onCollapseChange?.(collapse.isCollapsed); }, [collapse.isCollapsed, onCollapseChange]);

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    const normalizeForSearch = (value) =>
        (value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    const displayedLayers = useMemo(() => {
        const q = normalizeForSearch(searchQuery);
        if (!q) return unifiedLayers;
        return unifiedLayers.filter((l) => normalizeForSearch(l.name).includes(q));
    }, [unifiedLayers, searchQuery]);

    const isFiltering = searchQuery.trim().length > 0;

    useEffect(() => {
        if (searchOpen) searchInputRef.current?.focus();
    }, [searchOpen]);

    const handleCloseSearch = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery('');
    }, []);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Escape') handleCloseSearch();
    };

    const handleReorder = useCallback((newOrder) => {
        if (isSwipe) {
            reorderInSlots?.(newOrder);
            const liveSlot = compareMode?.activeSlot;
            const livePaneIds = compareMode?.[`pane${liveSlot}`]?.activeLayerIds || [];
            const liveOrder = newOrder.filter(id => livePaneIds.includes(id));
            reorderActiveLayerIds(liveOrder);
        } else {
            reorderActiveLayerIds(newOrder);
        }
    }, [isSwipe, compareMode, reorderInSlots, reorderActiveLayerIds]);

    const { handleDragEnd } = useLayerSorting(effectiveActiveLayerIds, unifiedLayers, handleReorder);
    const sortableItems = useMemo(() => displayedLayers.map(l => l.id), [displayedLayers]);
    const isInegiMode = useMemo(() => isInegiBaseMode(effectiveActiveLayerIds), [effectiveActiveLayerIds]);

    const noLayers = unifiedLayers.length === 0;

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

    const [, setSearchParams] = useSearchParams();

    const handleRemoveAll = useCallback(() => {
        activeLayerIds.forEach(id => {
            const childIds = getAllChildLayerIds(id);
            [id, ...childIds].forEach(cid => clearLayerFilters(cid));
            onToggleLayer(id, false);
        });
        setSelectedLayerForSymbology(null);
        setSearchParams({}, { replace: true });
        if (mapRef?.current) {
            const { center, zoom } = getDefaultMapView();
            mapRef.current.getView().animate({ center, zoom, duration: 500 });
        }
    }, [activeLayerIds, getAllChildLayerIds, clearLayerFilters, onToggleLayer, setSelectedLayerForSymbology, setSearchParams, mapRef]);

    useEffect(() => {
        if (!soloSeleccionada) return;
        const id = selectedLayerForSymbology?.id;
        if (!id) return;

        const visibles = new Set([id, ...getAllChildLayerIds(id)]);
        setHiddenLayerIds?.(effectiveActiveLayerIds.filter(cid => !visibles.has(cid)));
    }, [soloSeleccionada, selectedLayerForSymbology?.id, effectiveActiveLayerIds, getAllChildLayerIds, setHiddenLayerIds]);

    const selectedLayerLabel = useMemo(() => {
        const enPanel = unifiedLayers.find(l => l.id === selectedLayerForSymbology?.id);
        return enPanel?.name || resolveSelectedLayerLabel(selectedLayerForSymbology, layerTreeNodes);
    }, [unifiedLayers, selectedLayerForSymbology, layerTreeNodes]);

    const handleToggleVisibilityAll = useCallback(() => {
        setSoloSeleccionada(prev => {
            if (prev) showAllLayers();
            return !prev;
        });
    }, [showAllLayers, setSoloSeleccionada]);

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
        <div className="w-auto px-4.5 pt-2 pb-4.5 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] flex-1 min-h-0 flex flex-col max-md:pointer-events-auto">
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

            <ActiveLayersToolbar
                noLayers={noLayers}
                unifiedLayers={unifiedLayers}
                displayedLayers={displayedLayers}
                isFiltering={isFiltering}
                soloSeleccionada={soloSeleccionada}
                selectedLayerLabel={selectedLayerLabel}
                hasActiveLoops={hasActiveLoops}
                activeLoopsCount={activeLoopsCount}
                isInegiMode={isInegiMode}
                onToggleVisibilityAll={handleToggleVisibilityAll}
                onRemoveAll={handleRemoveAll}
                onPauseAll={pauseAllLoops}
                onToggleBaseMode={handleToggleBaseMode}
                searchOpen={searchOpen}
                searchQuery={searchQuery}
                onChangeSearchQuery={setSearchQuery}
                onOpenSearch={() => setSearchOpen(true)}
                onCloseSearch={handleCloseSearch}
                onSearchKeyDown={handleSearchKeyDown}
                searchInputRef={searchInputRef}
            />


            <ScrollContainer
                className="flex-1 min-h-0 mx-0 px-1"
                overlayFade
                clickableArrows
                minItemsForClick={5}
                itemCount={displayedLayers.length}
            >
                {isFiltering && displayedLayers.length === 0 ? (
                    <div className="py-6 text-center text-[12px] font-garet text-graphite">
                        Sin coincidencias para “{searchQuery}”
                    </div>
                ) : (
                    <SortableList
                        items={sortableItems}
                        onSortEnd={handleDragEnd}
                        disabled={isFiltering}
                    >
                        <div className="space-y-1 py-1">
                            {displayedLayers.map((layer) => (
                                <SortableItem key={layer.id} id={layer.id} isSticky={selectedLayerForSymbology?.id === layer.id}>
                                    <ActiveLayerItem layer={layer} isPinned={pinnedLayerIds.has(layer.id)} />
                                </SortableItem>
                            ))}
                        </div>
                    </SortableList>
                )}
            </ScrollContainer>
        </div>
    );
};

const ActiveLayersList = (props) => (
    <LegendsVisibilityProvider>
        <StatsVisibilityProvider>
            <ActiveLayersListInner {...props} />
        </StatsVisibilityProvider>
    </LegendsVisibilityProvider>
);

export default ActiveLayersList;
