import { useRef, useEffect } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import { useMapInitialization } from '@hooksMaps/useMapInitialization';
import { useMapViewUrlSync } from '@hooksMaps/useMapViewUrlSync';
import { useBaseMapManager } from '@hooksMaps/useBaseMapManager';

import { useWMSLayerFactory } from '@hooksMaps/useWMSLayerFactory';
import { useWMSLayerManager } from '@hooksMaps/useWMSLayerManager';
import { useMapInteractions } from '@hooksMaps/useMapInteractions';
import { useWMSFilterUpdater } from '@hooksMaps/useWMSFilterUpdater';
import { useActiveLayersLogic } from '@hooksMaps/useActiveLayersLogic';

const MapView = () => {
    const {
        baseMapId, basemaps, targetRef, mapRef, activeLayerIds, hiddenLayerIds, getFilter, filters,
        isDrawing, queryFeaturesInPolygonRef, getAllChildLayerIds, getLayerOpacity, layerOpacities
    } = useMapsContext();
    const { queryFeatures, queryFeaturesInPolygon } = useFeatureInfo();
    const baseMapRef = useRef(null);

    const { unifiedLayers } = useActiveLayersLogic(activeLayerIds, hiddenLayerIds);

    useEffect(() => {
        queryFeaturesInPolygonRef.current = queryFeaturesInPolygon;
    }, [queryFeaturesInPolygon, queryFeaturesInPolygonRef]);

    useMapInitialization({ targetRef, mapRef, baseMapRef, basemaps, baseMapId });
    useMapViewUrlSync(mapRef);
    useBaseMapManager(baseMapRef, basemaps, baseMapId, mapRef);

    const { createWMSLayer, combineCQLFilters } = useWMSLayerFactory();
    const { wmsLayersRef } = useWMSLayerManager({ 
        mapRef, activeLayerIds, hiddenLayerIds, unifiedLayers, createWMSLayer, getAllChildLayerIds, 
        getLayerOpacity, layerOpacities 
    });

    useMapInteractions(mapRef, queryFeatures, isDrawing);
    useWMSFilterUpdater({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds });

    return <div ref={targetRef} className="absolute inset-0 w-full h-full" />;
};

export default MapView;
