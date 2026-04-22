import { useState, useCallback, useMemo, useRef } from 'react';
import { useClickPosition } from '@hooks/useClickPosition';
import { useLayers } from '@hooks/useLayers';
import MapsContext from '@contexts/MapsContext';
import { BASEMAPS } from '@pages/maps/helpers/basemaps';
import { useLayerManagement } from '@hooksMaps/useLayerManagement';
import { useSymbology } from '@hooksMaps/useSymbology';
import { useLayerOpacity } from '@hooksMaps/useLayerOpacity';
import { useLayerToggle } from '@hooksMaps/useLayerToggle';
import { useCQLFilter } from '@hooksMaps/useCQLFilter';
import { useDateLoop } from '@hooksMaps/useDateLoop';
import { useMapDrawing } from '@hooksMaps/useMapDrawing';
import { usePeriodicityCache } from '@hooksMaps/usePeriodicityCache';
import { useMapMarker } from '@hooksMaps/useMapMarker';
import { useMapEditing } from '@hooksMaps/useMapEditing';
import { toLonLat } from 'ol/proj';

const MapsProvider = ({ children }) => {
    const { layers: allLayers } = useLayers();
    const [baseMapId, setBaseMapId] = useState('voyager');
    const [siderCollapsed, setSiderCollapsed] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null);
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
    const cqlFilter = useCQLFilter();
    const periodicityCache = usePeriodicityCache(layerManagement.activeLayerIds);
    const mapMarker = useMapMarker(mapRef, { setSelectedFeatureInfo, clickPosition });
    const layerToggle = useLayerToggle({
        ...layerManagement,
        setSelectedLayer,
        setSelectedLayerForSymbology: symbology.setSelectedLayerForSymbology,
        applyFilter: cqlFilter.applyFilter,
        clearFilter: cqlFilter.clearFilter,
        periodicityCache,
        mapRef,
        showMarker: mapMarker.showMarker,
        hideMarker: mapMarker.hideMarker
    });
    const dateLoop = useDateLoop({
        applyFilter: cqlFilter.applyFilter,
        clearFilter: cqlFilter.clearFilter,
        activeLayerIds: layerManagement.activeLayerIds,
        hiddenLayerIds: symbology.hiddenLayerIds,
        getSpecificFilter: cqlFilter.getSpecificFilter,
        getPeriodicity: periodicityCache.getPeriodicity
    });

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

    const mapEditing = useMapEditing({
        mapRef,
        vectorSourceRef: mapDrawing.vectorSourceRef,
        vectorLayerRef: mapDrawing.vectorLayerRef,
        measurements: mapDrawing.measurements,
        setMeasurements: mapDrawing.setMeasurements,
        isDrawing: mapDrawing.isDrawing,
        measureType: mapDrawing.measureType,
        lastPlacedAnnotation: mapDrawing.lastPlacedAnnotation
    });

    const mapsAnalyticsEvent = useCallback(() => { }, []);

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
        allLayers,

        ...layerManagement,
        onToggleLayer: layerToggle.handleToggleLayer,
        applyDefaultDate: layerToggle.applyDefaultDate,
        ...symbology,
        ...layerOpacity,
        ...cqlFilter,
        ...dateLoop,
        ...mapDrawing,
        ...mapEditing,
        ...mapMarker,
        periodicityCache,
        isLocating,
        setIsLocating
    }), [
        baseMapId,
        siderCollapsed,
        selectedLayer,
        mapsAnalyticsEvent,
        layerManagement,
        layerToggle.handleToggleLayer,
        layerToggle.applyDefaultDate,
        symbology,
        layerOpacity,
        selectedFeatureInfo,
        setSelectedFeatureInfo,
        clickPosition,
        cqlFilter,
        dateLoop,
        mapDrawing,
        mapEditing,
        mapMarker,
        periodicityCache,
        isLocating,
        allLayers
    ]);

    return (
        <MapsContext.Provider value={value}>
            {children}
        </MapsContext.Provider>
    );
};

export default MapsProvider;