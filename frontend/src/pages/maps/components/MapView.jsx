import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import { useMapInitialization } from '@hooksMaps/useMapInitialization';
import { useBaseMapManager } from '@hooksMaps/useBaseMapManager';
import { useLayers } from '@hooks/useLayers';

import { useWMSLayerFactory } from '@hooksMaps/useWMSLayerFactory';
import { useWMSLayerManager } from '@hooksMaps/useWMSLayerManager';
import { useMapInteractions } from '@hooksMaps/useMapInteractions';
import { useWMSFilterUpdater } from '@hooksMaps/useWMSFilterUpdater';
import { findFilterFromState } from '@hooksMaps/useCQLFilter';
import { useAlwaysOnTopPinning } from '@hooksMaps/useAlwaysOnTopPinning';

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

    const activeLayerIds = useLiveState ? ctx.activeLayerIds : paneSnapshot.activeLayerIds;
    const hiddenLayerIds = useLiveState ? ctx.hiddenLayerIds : paneSnapshot.hiddenLayerIds;
    const layerOpacities = useLiveState ? ctx.layerOpacities : paneSnapshot.layerOpacities;
    const filters = useLiveState ? ctx.filters : paneSnapshot.filters;

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

    const handlePaneClick = useCallback(async (map, coordinate, evt) => {
        if (isCompare && !isActiveSlotPane && setActiveSlot) {
            setActiveSlot(paneIndex === 0 ? 'A' : 'B');
        }
        return queryFeatures(map, coordinate, evt);
    }, [queryFeatures, isCompare, isActiveSlotPane, setActiveSlot, paneIndex]);

    useEffect(() => {
        if (isCompare) return;
        queryFeaturesInPolygonRef.current = queryFeaturesInPolygon;
    }, [queryFeaturesInPolygon, queryFeaturesInPolygonRef, isCompare]);

    const { mapInstance: localMapInstance } = useMapInitialization({ targetRef, mapRef, baseMapRef, basemaps: ctx.basemaps, baseMapId: ctx.baseMapId });
    useBaseMapManager(baseMapRef, ctx.basemaps, ctx.baseMapId, mapRef);

    useEffect(() => {
        if (!isCompare || !setPaneMapInstance) return undefined;
        setPaneMapInstance(paneIndex, localMapInstance || null);
        return () => setPaneMapInstance(paneIndex, null);
    }, [isCompare, paneIndex, localMapInstance, setPaneMapInstance]);

    const { createWMSLayer, combineCQLFilters } = useWMSLayerFactory();
    const { initialOrder } = useLayers();
    const compareModeActive = !!ctx.compareMode?.active;
    const pinnedLayerIds = useAlwaysOnTopPinning({ activeLayerIds, hiddenLayerIds, compareModeActive });
    const { wmsLayersRef } = useWMSLayerManager({
        mapRef, activeLayerIds, hiddenLayerIds, createWMSLayer, getAllChildLayerIds,
        getLayerOpacity, layerOpacities, getFilter, combineCQLFilters,
        pinnedLayerIds, initialOrder
    });

    useMapInteractions(mapRef, handlePaneClick, isDrawing, markerClickedRef, editingClickedRef);
    useWMSFilterUpdater({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds });

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
