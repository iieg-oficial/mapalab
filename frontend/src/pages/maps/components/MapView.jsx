import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import { useMapInitialization } from '@hooksMaps/useMapInitialization';
import { useBaseMapManager } from '@hooksMaps/useBaseMapManager';
import { useReliefOverlay } from '@hooksMaps/useReliefOverlay';
import { isInegiBaseMode } from '@pages/maps/helpers/basemaps';
import { useLayers } from '@hooks/useLayers';

import { useWMSLayerFactory } from '@hooksMaps/useWMSLayerFactory';
import { useWMSLayerManager } from '@hooksMaps/useWMSLayerManager';
import { useVectorServiceLayerManager } from '@hooksMaps/useVectorServiceLayerManager';
import { isVectorService } from '@pages/maps/helpers/serviceMode';
import { findHexbinCellAtPixel, markSelectedCell } from '@pages/maps/helpers/vectorFeatureQuery';
import { useMapInteractions } from '@hooksMaps/useMapInteractions';
import { useWMSFilterUpdater } from '@hooksMaps/useWMSFilterUpdater';
import { findFilterFromState } from '@hooksMaps/useCQLFilter';
import { useAlwaysOnTopPinning } from '@hooksMaps/useAlwaysOnTopPinning';

const EMPTY_VECTOR_MODES = new Map();

const MapView = ({ paneIndex = null, className = 'absolute inset-0 w-full h-full' }) => {
    const ctx = useMapsContext();
    const localTargetRef = useRef(null);
    const localMapRef = useRef(null);
    const isCompare = paneIndex !== null;
    const targetRef = isCompare ? localTargetRef : ctx.targetRef;
    const mapRef = isCompare ? localMapRef : ctx.mapRef;

    const isActiveSlotPane = isCompare && (
        (paneIndex === 0 && ctx.compareMode?.activeSlot === 'A')
        || (paneIndex === 1 && ctx.compareMode?.activeSlot === 'B')
    );
    const useLiveState = !isCompare || isActiveSlotPane;
    const relevantPane = paneIndex === 0 ? ctx.compareMode?.paneA : ctx.compareMode?.paneB;

    const paneSnapshot = useMemo(() => {
        if (useLiveState) return null;
        return relevantPane;
    }, [useLiveState, relevantPane]);

    const activeLayerIds = useLiveState ? ctx.activeLayerIds : paneSnapshot?.activeLayerIds;
    const hiddenLayerIds = useLiveState ? ctx.hiddenLayerIds : paneSnapshot?.hiddenLayerIds;
    const layerOpacities = useLiveState ? ctx.layerOpacities : paneSnapshot?.layerOpacities;
    const filters = useLiveState ? ctx.filters : paneSnapshot?.filters;

    const paneGetFilter = useCallback((layerId) => {
        return findFilterFromState(filters, layerId, ctx.allLayers);
    }, [filters, ctx.allLayers]);

    const paneGetLayerOpacity = useCallback((layerId) => {
        return layerOpacities?.get?.(layerId) ?? 1;
    }, [layerOpacities]);

    const getFilter = useLiveState ? ctx.getFilter : paneGetFilter;
    const getLayerOpacity = useLiveState ? ctx.getLayerOpacity : paneGetLayerOpacity;

    const { isDrawing, queryFeaturesInPolygonRef, getAllChildLayerIds, markerClickedRef, editingClickedRef, paneMapRefs, setActiveSlot, openMarkerCard, setPaneMapInstance } = ctx;

    useEffect(() => {
        if (!isCompare || !paneMapRefs?.current) return;
        const registry = paneMapRefs.current;
        registry[paneIndex] = localMapRef;
        return () => {
            if (registry[paneIndex] === localMapRef) delete registry[paneIndex];
        };
    }, [isCompare, paneIndex, paneMapRefs]);

    const featureInfoOverrides = useMemo(() => (
        isCompare ? { activeLayerIds, hiddenLayerIds, getFilter } : null
    ), [isCompare, activeLayerIds, hiddenLayerIds, getFilter]);

    const { queryFeatures, queryFeaturesInPolygon } = useFeatureInfo(featureInfoOverrides);
    const baseMapRef = useRef(null);
    const labelsOverlayRef = useRef(null);
    const reliefOverlayRef = useRef(null);
    const isInegiMode = useMemo(() => isInegiBaseMode(activeLayerIds), [activeLayerIds]);

    const handlePaneClick = useCallback(async (map, coordinate, evt) => {
        if (isCompare && !isActiveSlotPane && setActiveSlot) {
            setActiveSlot(paneIndex === 0 ? 'A' : 'B');
        }

        const cell = findHexbinCellAtPixel(map, coordinate, vectorLayerIdsRef.current);
        if (cell) {
            markSelectedCell(cell.layer, cell.h3Index);
            return queryFeaturesInPolygon(map, cell.geometry, coordinate);
        }

        return queryFeatures(map, coordinate, evt);
    }, [queryFeatures, queryFeaturesInPolygon, isCompare, isActiveSlotPane, setActiveSlot, paneIndex]);

    useEffect(() => {
        if (isCompare) return;
        queryFeaturesInPolygonRef.current = queryFeaturesInPolygon;
    }, [queryFeaturesInPolygon, queryFeaturesInPolygonRef, isCompare]);

    const { mapInstance: localMapInstance } = useMapInitialization({ targetRef, mapRef, baseMapRef, labelsOverlayRef, reliefOverlayRef, basemaps: ctx.basemaps, baseMapId: ctx.baseMapId });
    useBaseMapManager(baseMapRef, ctx.basemaps, ctx.baseMapId, mapRef, labelsOverlayRef);
    useReliefOverlay(reliefOverlayRef, ctx.baseMapId, isInegiMode);

    useEffect(() => {
        if (!isCompare || !setPaneMapInstance) return undefined;
        setPaneMapInstance(paneIndex, localMapInstance || null);
        return () => setPaneMapInstance(paneIndex, null);
    }, [isCompare, paneIndex, localMapInstance, setPaneMapInstance]);

    const { createWMSLayer, combineCQLFilters } = useWMSLayerFactory();
    const { initialOrder } = useLayers();
    const compareModeActive = !!ctx.compareMode?.active;
    const pinnedLayerIds = useAlwaysOnTopPinning({ activeLayerIds, hiddenLayerIds, compareModeActive });
    const municipioContext = ctx.municipioMode?.municipioContext || null;

    const vectorModes = useMemo(() => {
        const modes = ctx.layerServiceModes;
        if (!modes || modes.size === 0) return EMPTY_VECTOR_MODES;
        const local = new Map();
        modes.forEach((mode, id) => {
            if (isVectorService(mode)) local.set(id, mode);
        });
        return local.size > 0 ? local : EMPTY_VECTOR_MODES;
    }, [ctx.layerServiceModes]);

    const vectorLayerIds = useMemo(() => new Set(vectorModes.keys()), [vectorModes]);
    const vectorLayerIdsRef = useRef(vectorLayerIds);
    vectorLayerIdsRef.current = vectorLayerIds;

    const { wmsLayersRef } = useWMSLayerManager({
        mapRef, activeLayerIds, hiddenLayerIds, createWMSLayer, getAllChildLayerIds,
        getLayerOpacity, layerOpacities, getFilter, combineCQLFilters,
        pinnedLayerIds, initialOrder, municipioContext, vectorLayerIds
    });

    const { rejectVectorMode, applyHexbinStats } = ctx;

    const handleVectorTooLarge = useCallback((layerId, info) => {
        rejectVectorMode?.(layerId, { reason: 'too-large', ...info });
    }, [rejectVectorMode]);
    const handleVectorError = useCallback((layerId) => {
        rejectVectorMode?.(layerId, { reason: 'error' });
    }, [rejectVectorMode]);

    useVectorServiceLayerManager({
        mapRef, activeLayerIds, hiddenLayerIds, vectorModes,
        getFilter, combineCQLFilters, getLayerOpacity, layerOpacities,
        pinnedLayerIds, initialOrder, municipioContext,
        onTooLarge: handleVectorTooLarge, onError: handleVectorError,
        onHexbinStats: applyHexbinStats,
        sinFondo: ctx.hexbinSinFondo
    });

    useMapInteractions(mapRef, handlePaneClick, isDrawing, markerClickedRef, editingClickedRef, ctx.municipioMode?.isInsideMunicipios);
    useWMSFilterUpdater({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds, municipioContext });

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !openMarkerCard || !markerClickedRef) return undefined;
        const handleMarkerClick = (evt) => {
            markerClickedRef.current = false;
            map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                if (markerClickedRef.current) return;
                if (!feature.get('markerInfoBox')) return;
                markerClickedRef.current = true;
                openMarkerCard(feature, map);
            });
        };
        map.on('click', handleMarkerClick);
        return () => map.un('click', handleMarkerClick);
    }, [mapRef, openMarkerCard, markerClickedRef]);

    return <div ref={targetRef} className={className} />;
};

export default MapView;
