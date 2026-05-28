import { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useClickPosition } from '@hooks/useClickPosition';
import { useLayers } from '@hooks/useLayers';
import MapsContext from '@contexts/MapsContext';
import EventoProvider from '@providers/EventoProvider';
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
import { useFeatureHighlight } from '@hooksMaps/useFeatureHighlight';
import { useMapEditing } from '@hooksMaps/useMapEditing';
import { useSwipeMode } from '@hooksMaps/useSwipeMode';
import { useMunicipioMode } from '@hooksMaps/useMunicipioMode';
import { useMunicipioMask } from '@hooksMaps/useMunicipioMask';
import { useMunicipioFit } from '@hooksMaps/useMunicipioFit';
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
    const compareModeRef = useRef(null);
    const paneMapRefs = useRef({});
    const [paneMapInstances, setPaneMapInstances] = useState({});

    const setPaneMapInstance = useCallback((paneIndex, instance) => {
        setPaneMapInstances(prev => {
            if (instance === null) {
                if (!(paneIndex in prev)) return prev;
                const next = { ...prev };
                delete next[paneIndex];
                return next;
            }
            if (prev[paneIndex] === instance) return prev;
            return { ...prev, [paneIndex]: instance };
        });
    }, []);
    const layerManagement = useLayerManagement();
    const layerOpacity = useLayerOpacity(layerManagement.getAllChildLayerIds, layerManagement.activeLayerIds);
    const cqlFilter = useCQLFilter();
    const periodicityCache = usePeriodicityCache(layerManagement.activeLayerIds);
    const mapMarker = useMapMarker(mapRef, paneMapRefs, compareModeRef, { setSelectedFeatureInfo, clickPosition });

    const liveStateRef = useRef();
    const swipeMode = useSwipeMode({
        liveStateRef,
        getAllChildLayerIds: layerManagement.getAllChildLayerIds,
        paneMapRefs,
    });
    compareModeRef.current = swipeMode.compareMode;

    useFeatureHighlight({
        mapRef,
        paneMapRefs,
        compareMode: swipeMode.compareMode,
        selectedFeatureInfo,
        allLayers,
    });

    const symbology = useSymbology({
        activeLayerIds: layerManagement.activeLayerIds,
        findLayerById: layerManagement.findLayerById,
        getAllChildLayerIds: layerManagement.getAllChildLayerIds,
        allLayers,
        compareMode: swipeMode.compareMode,
    });

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
    const swipeFilterRef = useRef({});
    swipeFilterRef.current = {
        active: swipeMode.compareMode.active,
        activeSlot: swipeMode.compareMode.activeSlot,
        applyFilterToSlot: swipeMode.applyFilterToSlot,
        clearFilterFromSlot: swipeMode.clearFilterFromSlot,
        applyFilter: cqlFilter.applyFilter,
        clearFilter: cqlFilter.clearFilter,
    };
    const applyFilterSwipeAware = useCallback((layerId, filterName, cqlExpression) => {
        const s = swipeFilterRef.current;
        if (s.active) {
            s.applyFilterToSlot(layerId, s.activeSlot, filterName, cqlExpression);
            return;
        }
        s.applyFilter(layerId, filterName, cqlExpression);
    }, []);
    const clearFilterSwipeAware = useCallback((layerId, filterName) => {
        const s = swipeFilterRef.current;
        if (s.active) {
            s.clearFilterFromSlot(layerId, s.activeSlot, filterName);
            return;
        }
        s.clearFilter(layerId, filterName);
    }, []);

    const dateLoop = useDateLoop({
        applyFilter: applyFilterSwipeAware,
        clearFilter: clearFilterSwipeAware,
        activeLayerIds: layerManagement.activeLayerIds,
        hiddenLayerIds: symbology.hiddenLayerIds,
        getSpecificFilter: cqlFilter.getSpecificFilter,
        getPeriodicity: periodicityCache.getPeriodicity
    });

    useLayoutEffect(() => {
        liveStateRef.current = {
            activeLayerIds: layerManagement.activeLayerIds,
            setActiveLayerIds: layerManagement.setActiveLayerIds,
            hiddenLayerIds: symbology.hiddenLayerIds,
            setHiddenLayerIds: symbology.setHiddenLayerIds,
            layerOpacities: layerOpacity.layerOpacities,
            setLayerOpacities: layerOpacity.setLayerOpacities,
            filters: cqlFilter.filters,
            setFilters: cqlFilter.setFilters,
            pauseAllLoops: dateLoop.pauseAllLoops,
        };
    });

    const onToggleLayer = useCallback((layerId, force, options) => {
        const cm = swipeMode.compareMode;
        if (!cm.active) {
            return layerToggle.handleToggleLayer(layerId, force, options);
        }
        const inA = cm.paneA.activeLayerIds.includes(layerId);
        const inB = cm.paneB.activeLayerIds.includes(layerId);
        const wantsActivate = force === true || (force === undefined && !inA && !inB);
        if (wantsActivate && !inA && !inB) {
            layerToggle.handleToggleLayer(layerId, true);
            swipeMode.setLayerSlotMembership(layerId, 'AB');
            return undefined;
        }
        if (!wantsActivate) {
            if (inA) swipeMode.removeLayerFromSlot(layerId, 'A');
            if (inB) swipeMode.removeLayerFromSlot(layerId, 'B');
            return undefined;
        }
        return undefined;
    }, [swipeMode, layerToggle]);

    const municipioModeRef = useRef(null);
    const handlePolygonComplete = useCallback((geometry, centerCoordinate, onFeatureCountUpdate) => {
        const guard = municipioModeRef.current?.polygonIntersectsMunicipios;
        if (typeof guard === 'function' && !guard(geometry)) {
            return;
        }
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

    const municipioMode = useMunicipioMode({
        activeLayerIds: layerManagement.activeLayerIds,
    });
    municipioModeRef.current = municipioMode;

    useMunicipioMask({
        active: municipioMode.active,
        geometries: municipioMode.geometries,
        mapRef,
        paneMapInstances,
    });

    const centerOnMunicipioSelection = useMunicipioFit({
        municipioMode, mapRef, paneMapInstances,
        swipeCompareModeActive: swipeMode.compareMode?.active,
    });

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
        paneMapInstances,
        setPaneMapInstance,
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
        onToggleLayer,
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
        setIsLocating,
        ...swipeMode,
        municipioMode: { ...municipioMode, centerOnSelection: centerOnMunicipioSelection },
    }), [
        baseMapId,
        siderCollapsed,
        selectedLayer,
        paneMapInstances,
        setPaneMapInstance,
        mapsAnalyticsEvent,
        layerManagement,
        onToggleLayer,
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
        allLayers,
        swipeMode,
        municipioMode,
        centerOnMunicipioSelection,
    ]);

    return (
        <MapsContext.Provider value={value}>
            <EventoProvider>
                {children}
            </EventoProvider>
        </MapsContext.Provider>
    );
};

export default MapsProvider;
