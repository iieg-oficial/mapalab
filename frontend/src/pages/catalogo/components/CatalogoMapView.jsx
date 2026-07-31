import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultInteractions } from 'ol/interaction/defaults';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import MapsContext from '@contexts/MapsContext';
import { SiderContext } from '@contexts/SiderContext';
import MapControls from '@pages/maps/components/MapControls';
import MapAttribution from '@pages/maps/components/MapAttribution';
import LottieSpinner from '@components/LottieSpinner';
import CatalogoInfoButton from './CatalogoInfoButton';
import CatalogoInfoBox from './CatalogoInfoBox';
import CatalogoTools from './CatalogoTools';
import CatalogoTimeBar from './CatalogoTimeBar';
import { useCatalogoTiempoContext } from '../hooks/catalogoTiempoContext';
import { useCatalogoPoligono } from '../hooks/useCatalogoPoligono';
import { buildWmsLayer, geojson, HIGHLIGHT_STYLE, HIGHLIGHT_Z } from '../helpers/catalogoMapLayer';
import { BASEMAPS, RELIEF_OVERLAY, RELIEF_OVERLAY_Z_INDEX } from '@pages/maps/helpers/basemaps';
import { JALISCO_BOUNDS, hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { getMinZoom, ZOOM_ANIMATION_MS } from '@pages/maps/helpers/defaultView';
import { useScaleLineControl } from '@hooksMaps/useScaleLineControl';
import { useMapDrawing } from '@hooksMaps/useMapDrawing';
import { useMapEditing } from '@hooksMaps/useMapEditing';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';
import { trackCatalogoFeatureClick } from '@services/analyticsService';
import { FEATURE_COUNT_CAP } from '@services/featureInfoService';

const CATALOGO_ANNOTATIONS_KEY = 'mapalab.catalogo.annotations';

const SIDER_STUB = {
    siderRef: { current: null },
    toolsButtonRef: { current: null },
    width: 0,
    collapsedWidth: 0,
    expandedWidth: 0,
    isMobile: false,
    isOpen: false,
};

const CatalogoMapView = ({ capa, onEditInfobox = null }) => {
    const { tiempo, loop, wmsLayerRef } = useCatalogoTiempoContext();
    const targetRef = useRef(null);
    const scaleRef = useRef(null);
    const mapRef = useRef(null);
    const highlightSourceRef = useRef(null);
    const clickSeqRef = useRef(0);
    const [isLocating, setIsLocating] = useState(false);
    const [info, setInfo] = useState(null);
    const [layerLoading, setLayerLoading] = useState(false);

    const { seleccion, consultar, cargarMas, limpiar, reposicionar } = useCatalogoPoligono({ mapRef, capa, tiempo });

    const clearInfo = useCallback(() => {
        setInfo(null);
        highlightSourceRef.current?.clear();
        limpiar();
    }, [limpiar]);

    const getMapInstance = useCallback(() => mapRef.current, []);
    useScaleLineControl(getMapInstance, scaleRef);

    const consultarRef = useRef(null);
    useEffect(() => {
        consultarRef.current = consultar;
    }, [consultar]);

    const handlePolygonComplete = useCallback((geometry, centerCoordinate, onFeatureCountUpdate) => {
        setInfo(null);
        highlightSourceRef.current?.clear();
        consultarRef.current?.(geometry, centerCoordinate, onFeatureCountUpdate);
    }, []);

    const drawing = useMapDrawing(mapRef, handlePolygonComplete, null, { storageKey: CATALOGO_ANNOTATIONS_KEY });
    const editing = useMapEditing({
        mapRef,
        vectorSourceRef: drawing.vectorSourceRef,
        vectorLayerRef: drawing.vectorLayerRef,
        measurements: drawing.measurements,
        setMeasurements: drawing.setMeasurements,
        isDrawing: drawing.isDrawing,
        measureType: drawing.measureType,
        lastPlacedAnnotation: drawing.lastPlacedAnnotation,
    });

    const isDrawingRef = useRef(false);
    useEffect(() => {
        isDrawingRef.current = drawing.isDrawing;
    }, [drawing.isDrawing]);

    const capaRef = useRef(null);
    useEffect(() => {
        capaRef.current = capa;
    }, [capa]);

    const mapsContextValue = useMemo(() => ({
        mapRef,
        baseMapId: 'voyager',
        compareMode: null,
        paneMapRefs: { current: [] },
        isLocating,
        setIsLocating,
        getSpecificFilter: tiempo.getSpecificFilter,
        getLoopState: loop.getLoopState,
        stopLoop: loop.stopLoop,
        ...drawing,
        ...editing,
    }), [isLocating, drawing, editing, tiempo.getSpecificFilter, loop.getLoopState, loop.stopLoop]);

    useEffect(() => {
        if (!targetRef.current || mapRef.current) return;

        const voyager = BASEMAPS.voyager;
        const reliefLayer = new TileLayer({
            source: RELIEF_OVERLAY.iieg(),
            zIndex: RELIEF_OVERLAY_Z_INDEX,
        });
        reliefLayer.on('prerender', (evt) => {
            evt.context.globalCompositeOperation = 'multiply';
        });
        reliefLayer.on('postrender', (evt) => {
            evt.context.globalCompositeOperation = 'source-over';
        });

        const map = new OLMap({
            target: targetRef.current,
            layers: [
                new TileLayer({ source: voyager.create(), zIndex: -1 }),
                reliefLayer,
            ],
            view: new View({
                center: fromLonLat(JALISCO_BOUNDS.center),
                zoom: JALISCO_BOUNDS.zoom,
                minZoom: getMinZoom(),
                maxZoom: 18,
                projection: 'EPSG:3857',
                constrainResolution: true,
            }),
            controls: [],
            interactions: defaultInteractions({ mouseWheelZoom: false })
                .extend([new MouseWheelZoom({ duration: ZOOM_ANIMATION_MS })]),
        });

        mapRef.current = map;

        const highlightSource = new VectorSource();
        highlightSourceRef.current = highlightSource;
        map.addLayer(new VectorLayer({ source: highlightSource, style: HIGHLIGHT_STYLE, zIndex: HIGHLIGHT_Z }));

        const handleClick = async (evt) => {
            if (isDrawingRef.current) return;
            const layer = wmsLayerRef.current;
            if (!layer) {
                clearInfo();
                return;
            }
            const view = map.getView();
            const url = layer.getSource().getFeatureInfoUrl(
                evt.coordinate,
                view.getResolution(),
                view.getProjection(),
                { INFO_FORMAT: 'application/json', FEATURE_COUNT: FEATURE_COUNT_CAP },
            );
            if (!url) return;
            const seq = ++clickSeqRef.current;
            const pixel = evt.pixel;
            try {
                const res = await fetch(url);
                const data = await res.json();
                if (seq !== clickSeqRef.current) return;
                const features = data?.features || [];
                trackCatalogoFeatureClick({ slug: capaRef.current?.slug || null, count: features.length });
                const [lng, lat] = toLonLat(evt.coordinate);
                setInfo({ features, pixel, lngLat: { lng, lat } });
                highlightSourceRef.current?.clear();
                if (features.length) {
                    const parsed = features
                        .filter((f) => f?.geometry)
                        .map((f) => {
                            try { return geojson.readFeature(f, { dataProjection: 'EPSG:3857', featureProjection: 'EPSG:3857' }); } catch { return null; }
                        })
                        .filter(Boolean);
                    highlightSourceRef.current?.addFeatures(parsed);
                }
            } catch {
                if (seq === clickSeqRef.current) clearInfo();
            }
        };
        map.on('singleclick', handleClick);

        return () => {
            map.un('singleclick', handleClick);
            map.setTarget(undefined);
            mapRef.current = null;
        };
    }, [clearInfo, wmsLayerRef]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        clearInfo();
        if (wmsLayerRef.current) {
            map.removeLayer(wmsLayerRef.current);
            wmsLayerRef.current = null;
        }
        if (!capa) {
            setLayerLoading(false);
            return;
        }
        const layer = buildWmsLayer(capa);
        if (!layer) {
            setLayerLoading(false);
            return;
        }
        map.addLayer(layer);
        wmsLayerRef.current = layer;

        const source = layer.getSource();
        const onLoadStart = () => setLayerLoading(true);
        const onLoadEnd = () => setLayerLoading(false);
        source.on('imageloadstart', onLoadStart);
        source.on('imageloadend', onLoadEnd);
        source.on('imageloaderror', onLoadEnd);
        setLayerLoading(true);

        const cfg = hydrateWmsConfig({
            geoserverWorkspace: capa.geoserverWorkspace,
            geoserverLayer: capa.geoserverLayer,
        });
        const jalisco = () => transformExtent(JALISCO_BOUNDS.coords, 'EPSG:4326', 'EPSG:3857');
        let cancelled = false;
        getLayerExtent3857(cfg)
            .then((extent) => {
                const view = mapRef.current?.getView();
                if (cancelled || !view) return;
                view.fit(extent || jalisco(), { duration: 500, padding: [60, 60, 60, 60], maxZoom: 16 });
            })
            .catch(() => {
                const view = mapRef.current?.getView();
                if (!cancelled && view) view.fit(jalisco(), { duration: 500, padding: [60, 60, 60, 60] });
            });
        return () => {
            cancelled = true;
            source.un('imageloadstart', onLoadStart);
            source.un('imageloadend', onLoadEnd);
            source.un('imageloaderror', onLoadEnd);
        };
    }, [capa, clearInfo, wmsLayerRef]);

    return (
        <>
            <div ref={targetRef} className="absolute inset-0" />

            <MapsContext.Provider value={mapsContextValue}>
                <SiderContext.Provider value={SIDER_STUB}>
                    <MapControls />
                    <CatalogoTools />
                </SiderContext.Provider>
                <MapAttribution hideActions extraRight={<CatalogoInfoButton />} />
                {capa && <CatalogoTimeBar tiempo={tiempo} loop={loop} />}
            </MapsContext.Provider>

            <div ref={scaleRef} className="fixed left-4 bottom-1 z-10" />

            {layerLoading && !loop.isLoopPlaying && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
                    <LottieSpinner loop autoplay className="w-32 h-32" />
                </div>
            )}

            {info && capa && (
                <CatalogoInfoBox
                    capa={capa}
                    features={info.features}
                    pixel={info.pixel}
                    lngLat={info.lngLat}
                    mapInstance={mapRef.current}
                    onReposition={(nextPixel) => setInfo((prev) => (prev ? { ...prev, pixel: nextPixel } : prev))}
                    onEdit={onEditInfobox}
                    onClose={clearInfo}
                />
            )}

            {seleccion && capa && (
                <CatalogoInfoBox
                    capa={capa}
                    features={seleccion.features}
                    pixel={seleccion.pixel}
                    lngLat={seleccion.lngLat}
                    mapInstance={mapRef.current}
                    onReposition={reposicionar}
                    onEdit={onEditInfobox}
                    onClose={clearInfo}
                    hasMore={seleccion.hasMore}
                    onLoadMore={cargarMas}
                    matched={seleccion.matched}
                />
            )}
        </>
    );
};

export default CatalogoMapView;
