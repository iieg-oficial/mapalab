import { useRef, useEffect } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import { useMapInitialization } from '@hooksMaps/useMapInitialization';
import { useBaseMapManager } from '@hooksMaps/useBaseMapManager';

import { useWMSLayerFactory } from '@hooksMaps/useWMSLayerFactory';
import { useWMSLayerManager } from '@hooksMaps/useWMSLayerManager';
import { useMapInteractions } from '@hooksMaps/useMapInteractions';
import { useWMSFilterUpdater } from '@hooksMaps/useWMSFilterUpdater';

const MapView = ({ paneIndex = null, dateOverride = null, className = 'absolute inset-0 w-full h-full' }) => {
    const ctx = useMapsContext();
    const {
        baseMapId, basemaps, activeLayerIds, hiddenLayerIds, getFilter, filters,
        isDrawing, queryFeaturesInPolygonRef, getAllChildLayerIds, getLayerOpacity, layerOpacities,
        markerClickedRef, editingClickedRef, paneMapRefs
    } = ctx;
    const localTargetRef = useRef(null);
    const localMapRef = useRef(null);
    const isCompare = paneIndex !== null;
    const targetRef = isCompare ? localTargetRef : ctx.targetRef;
    const mapRef = isCompare ? localMapRef : ctx.mapRef;

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

    useMapInitialization({ targetRef, mapRef, baseMapRef, basemaps, baseMapId });
    useBaseMapManager(baseMapRef, basemaps, baseMapId, mapRef);

    const { createWMSLayer, combineCQLFilters } = useWMSLayerFactory();
    const { wmsLayersRef } = useWMSLayerManager({
        mapRef, activeLayerIds, hiddenLayerIds, createWMSLayer, getAllChildLayerIds,
        getLayerOpacity, layerOpacities, getFilter, combineCQLFilters, dateOverride
    });

    useMapInteractions(mapRef, queryFeatures, isDrawing, markerClickedRef, editingClickedRef);
    useWMSFilterUpdater({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds, dateOverride });

    return <div ref={targetRef} className={className} />;
};

export default MapView;
