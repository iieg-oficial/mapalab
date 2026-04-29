import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import { useMapInitialization } from '@hooksMaps/useMapInitialization';
import { useBaseMapManager } from '@hooksMaps/useBaseMapManager';

import { useWMSLayerFactory } from '@hooksMaps/useWMSLayerFactory';
import { useWMSLayerManager } from '@hooksMaps/useWMSLayerManager';
import { useMapInteractions } from '@hooksMaps/useMapInteractions';
import { useWMSFilterUpdater } from '@hooksMaps/useWMSFilterUpdater';
import { findFilterFromState } from '@hooksMaps/useCQLFilter';

const MapView = ({ paneIndex = null, className = 'absolute inset-0 w-full h-full' }) => {
    const ctx = useMapsContext();
    const localTargetRef = useRef(null);
    const localMapRef = useRef(null);
    const isCompare = paneIndex !== null;
    const targetRef = isCompare ? localTargetRef : ctx.targetRef;
    const mapRef = isCompare ? localMapRef : ctx.mapRef;

    const paneSnapshot = useMemo(() => {
        if (!isCompare) return null;
        return paneIndex === 0 ? ctx.compareMode.paneA : ctx.compareMode.paneB;
    }, [isCompare, paneIndex, ctx.compareMode.paneA, ctx.compareMode.paneB]);

    const activeLayerIds = isCompare ? paneSnapshot.activeLayerIds : ctx.activeLayerIds;
    const hiddenLayerIds = isCompare ? paneSnapshot.hiddenLayerIds : ctx.hiddenLayerIds;
    const layerOpacities = isCompare ? paneSnapshot.layerOpacities : ctx.layerOpacities;
    const filters = isCompare ? paneSnapshot.filters : ctx.filters;

    const paneGetFilter = useCallback((layerId) => {
        if (!isCompare) return null;
        return findFilterFromState(filters, layerId, ctx.allLayers);
    }, [isCompare, filters, ctx.allLayers]);

    const paneGetLayerOpacity = useCallback((layerId) => {
        if (!isCompare) return 1;
        return layerOpacities.get(layerId) ?? 1;
    }, [isCompare, layerOpacities]);

    const getFilter = isCompare ? paneGetFilter : ctx.getFilter;
    const getLayerOpacity = isCompare ? paneGetLayerOpacity : ctx.getLayerOpacity;

    const { isDrawing, queryFeaturesInPolygonRef, getAllChildLayerIds, markerClickedRef, editingClickedRef, paneMapRefs } = ctx;

    useEffect(() => {
        if (!isCompare || !paneMapRefs?.current) return;
        const registry = paneMapRefs.current;
        registry[paneIndex] = localMapRef;
        return () => {
            delete registry[paneIndex];
        };
    }, [isCompare, paneIndex, paneMapRefs]);

    const { queryFeatures, queryFeaturesInPolygon } = useFeatureInfo();
    const baseMapRef = useRef(null);

    useEffect(() => {
        if (isCompare) return;
        queryFeaturesInPolygonRef.current = queryFeaturesInPolygon;
    }, [queryFeaturesInPolygon, queryFeaturesInPolygonRef, isCompare]);

    useMapInitialization({ targetRef, mapRef, baseMapRef, basemaps: ctx.basemaps, baseMapId: ctx.baseMapId });
    useBaseMapManager(baseMapRef, ctx.basemaps, ctx.baseMapId, mapRef);

    const { createWMSLayer, combineCQLFilters } = useWMSLayerFactory();
    const { wmsLayersRef } = useWMSLayerManager({
        mapRef, activeLayerIds, hiddenLayerIds, createWMSLayer, getAllChildLayerIds,
        getLayerOpacity, layerOpacities, getFilter, combineCQLFilters
    });

    useMapInteractions(mapRef, queryFeatures, isDrawing, markerClickedRef, editingClickedRef);
    useWMSFilterUpdater({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds });

    return <div ref={targetRef} className={className} />;
};

export default MapView;
