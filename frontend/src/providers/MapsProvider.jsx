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

const emptyPane = (label) => ({
    activeLayerIds: [],
    hiddenLayerIds: [],
    layerOpacities: new Map(),
    filters: {},
    label,
});

const initialCompareMode = () => ({
    active: false,
    activeSlot: 'A',
    paneA: emptyPane('A'),
    paneB: emptyPane('B'),
    originalSnapshot: null,
    swipePosition: 0.5,
});

const cloneSnapshot = (snapshot) => ({
    activeLayerIds: [...snapshot.activeLayerIds],
    hiddenLayerIds: [...snapshot.hiddenLayerIds],
    layerOpacities: new Map(snapshot.layerOpacities),
    filters: structuredClone(snapshot.filters),
    label: snapshot.label,
});

const MapsProvider = ({ children }) => {
    const { layers: allLayers } = useLayers();
    const [baseMapId, setBaseMapId] = useState('voyager');
    const [siderCollapsed, setSiderCollapsed] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [selectedFeatureInfo, setSelectedFeatureInfo] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [compareMode, setCompareMode] = useState(initialCompareMode);
    const queryFeaturesInPolygonRef = useRef(null);
    const clickPosition = useClickPosition();
    const targetRef = useRef(null);
    const mapRef = useRef(null);
    const paneMapRefs = useRef({});
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

    const liveStateRef = useRef();
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

    const snapshotLive = useCallback((label) => ({
        activeLayerIds: [...liveStateRef.current.activeLayerIds],
        hiddenLayerIds: [...liveStateRef.current.hiddenLayerIds],
        layerOpacities: new Map(liveStateRef.current.layerOpacities),
        filters: structuredClone(liveStateRef.current.filters),
        label,
    }), []);

    const applySnapshotToLive = useCallback((snapshot) => {
        const live = liveStateRef.current;
        live.setActiveLayerIds(snapshot.activeLayerIds);
        live.setHiddenLayerIds(snapshot.hiddenLayerIds);
        live.setLayerOpacities(new Map(snapshot.layerOpacities));
        live.setFilters(structuredClone(snapshot.filters));
    }, []);

    const enterSwipeMode = useCallback(() => {
        const current = snapshotLive('A');
        liveStateRef.current.pauseAllLoops();
        setCompareMode({
            active: true,
            activeSlot: 'B',
            paneA: current,
            paneB: cloneSnapshot({ ...current, label: 'B' }),
            originalSnapshot: cloneSnapshot({ ...current, label: 'original' }),
            swipePosition: 0.5,
        });
    }, [snapshotLive]);

    const setActiveSlot = useCallback((nextSlot) => {
        if (nextSlot !== 'A' && nextSlot !== 'B') return;
        setCompareMode(prev => {
            if (!prev.active || prev.activeSlot === nextSlot) return prev;
            const currentSnapshot = snapshotLive(prev[`pane${prev.activeSlot}`].label);
            const targetSnapshot = prev[`pane${nextSlot}`];
            applySnapshotToLive(targetSnapshot);
            return {
                ...prev,
                activeSlot: nextSlot,
                [`pane${prev.activeSlot}`]: currentSnapshot,
            };
        });
    }, [snapshotLive, applySnapshotToLive]);

    const clearPaneB = useCallback(() => {
        setCompareMode(prev => {
            if (!prev.active) return prev;
            const empty = emptyPane(prev.paneB.label || 'B');
            if (prev.activeSlot === 'B') {
                applySnapshotToLive(empty);
            }
            return { ...prev, paneB: empty };
        });
    }, [applySnapshotToLive]);

    const keepSlot = useCallback((slotToKeep) => {
        if (slotToKeep !== 'A' && slotToKeep !== 'B') return;
        setCompareMode(prev => {
            if (!prev.active) return prev;
            if (slotToKeep !== prev.activeSlot) {
                applySnapshotToLive(prev[`pane${slotToKeep}`]);
            }
            return initialCompareMode();
        });
    }, [applySnapshotToLive]);

    const exitCompareMode = useCallback(() => {
        setCompareMode(prev => {
            if (prev.active && prev.originalSnapshot) {
                applySnapshotToLive(prev.originalSnapshot);
            }
            return initialCompareMode();
        });
    }, [applySnapshotToLive]);

    const setSwipePosition = useCallback((pos) => {
        setCompareMode(prev => ({
            ...prev,
            swipePosition: Math.max(0.05, Math.min(0.95, pos)),
        }));
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
        setIsLocating,
        compareMode,
        setCompareMode,
        enterSwipeMode,
        setActiveSlot,
        clearPaneB,
        keepSlot,
        exitCompareMode,
        setSwipePosition,
        paneMapRefs
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
        allLayers,
        compareMode,
        enterSwipeMode,
        setActiveSlot,
        clearPaneB,
        keepSlot,
        exitCompareMode,
        setSwipePosition
    ]);

    return (
        <MapsContext.Provider value={value}>
            {children}
        </MapsContext.Provider>
    );
};

export default MapsProvider;
