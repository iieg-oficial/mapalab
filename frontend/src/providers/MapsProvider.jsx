import { useState, useCallback, useMemo, useRef } from 'react';
import { useClickPosition } from '@hooks/useClickPosition';
import MapsContext from '@contexts/MapsContext';
import { BASEMAPS } from '@pages/maps/helpers/basemaps';
import { useLayerManagement } from '@hooksMaps/useLayerManagement';
import { useSymbology } from '@hooksMaps/useSymbology';
import { useLayerOpacity } from '@hooksMaps/useLayerOpacity';
import { useLayerToggle } from '@hooksMaps/useLayerToggle';
import { useCQLFilter } from '@hooksMaps/useCQLFilter';
import { useRasterLoop } from '@hooksMaps/useRasterLoop';
import { useMapDrawing } from '@hooksMaps/useMapDrawing';
import { layers as allLayers } from '@pages/maps/helpers/layers/index';
import { toLonLat } from 'ol/proj';

const MapsProvider = ({ children }) => {
    const [baseMapId, setBaseMapId] = useState('voyager');
    const [siderCollapsed, setSiderCollapsed] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null);
    const [loadingLayers, setLoadingLayers] = useState(new Set());
    const [isLocating, setIsLocating] = useState(false);
    const queryFeaturesInPolygonRef = useRef(null);
    const clickPosition = useClickPosition();
    const targetRef = useRef(null);
    const mapRef = useRef(null);
    const layerManagement = useLayerManagement();
    const symbology = useSymbology({
        activeLayerIds: layerManagement.activeLayerIds,
        findLayerById: layerManagement.findLayerById,
        getAllChildLayerIds: layerManagement.getAllChildLayerIds,
        allLayers
    });
    const layerOpacity = useLayerOpacity(layerManagement.getAllChildLayerIds, layerManagement.activeLayerIds);
    const layerToggle = useLayerToggle(layerManagement);
    const cqlFilter = useCQLFilter();
    const rasterLoop = useRasterLoop({
        applyFilter: cqlFilter.applyFilter,
        clearFilter: cqlFilter.clearFilter,
        loadingLayers,
        mapRef,
        activeLayerIds: layerManagement.activeLayerIds
    });

    const setLayerLoading = useCallback((layerId, isLoading) => {
        setLoadingLayers(prev => {
            const newSet = new Set(prev);
            if (isLoading) {
                newSet.add(layerId);
            } else {
                newSet.delete(layerId);
            }
            return newSet;
        });
    }, []);

    const handlePolygonComplete = useCallback((geometry, centerCoordinate, onFeatureCountUpdate) => {
        if (queryFeaturesInPolygonRef.current && mapRef.current) {
            queryFeaturesInPolygonRef.current(mapRef.current, geometry, centerCoordinate, onFeatureCountUpdate);
        }
    }, []);

    const handleShowCachedSelection = useCallback((results, centerCoordinate) => {
        if (mapRef.current && centerCoordinate) {
            const pixel = mapRef.current.getPixelFromCoordinate(centerCoordinate);
            clickPosition.updatePosition({ pixel });

            const [lng, lat] = toLonLat(centerCoordinate);
            setSelectedFeatureInfo({
                lngLat: { lng, lat },
                results
            });
        }
    }, [clickPosition, setSelectedFeatureInfo]);

    const mapDrawing = useMapDrawing(mapRef, handlePolygonComplete, handleShowCachedSelection);

    const mapsAnalyticsEvent = useCallback((_action, _label) => {}, []);

    const value = useMemo(() => ({
        baseMapId,
        setBaseMapId,
        siderCollapsed,
        setSiderCollapsed,
        targetRef,
        mapRef,
        basemaps: BASEMAPS,
        selectedLayer,
        setSelectedLayer,
        onAnalytics: mapsAnalyticsEvent,
        selectedFeatureInfo,
        setSelectedFeatureInfo,
        clickPosition,
        queryFeaturesInPolygonRef,

        ...layerManagement,
        onToggleLayer: layerToggle.handleToggleLayer,
        ...symbology,
        ...layerOpacity,
        ...cqlFilter,
        ...rasterLoop,
        ...mapDrawing,
        loadingLayers,
        setLayerLoading,
        isLocating,
        setIsLocating
    }), [
        baseMapId,
        siderCollapsed,
        selectedLayer,
        mapsAnalyticsEvent,
        layerManagement,
        layerToggle.handleToggleLayer,
        symbology,
        layerOpacity,
        selectedFeatureInfo,
        setSelectedFeatureInfo,
        clickPosition,
        cqlFilter,
        rasterLoop,
        mapDrawing,
        loadingLayers,
        setLayerLoading,
        isLocating
    ]);

    return (
        <MapsContext.Provider value={value}>
            {children}
        </MapsContext.Provider>
    );
};

export default MapsProvider;