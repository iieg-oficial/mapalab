import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultInteractions } from 'ol/interaction/defaults';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import MapsContext from '@contexts/MapsContext';
import { View3dProvider } from '@contexts/View3dContext';
import MapControls from '@pages/maps/components/MapControls';
import MapAttribution from '@pages/maps/components/MapAttribution';
import LottieSpinner from '@components/LottieSpinner';
import CatalogoInfoBox from './CatalogoInfoBox';
import PanelMedicionSeleccion from '@mapsComponents/MeasurementTools/PanelMedicionSeleccion';
import CatalogoTools from './CatalogoTools';
import CatalogoTablaProviders from './CatalogoTablaProviders';
import CatalogoTimeBar from './CatalogoTimeBar';
import CatalogoVista3d from './CatalogoVista3d';
import { useCatalogoTiempoContext } from '../hooks/catalogoTiempoContext';
import { useCatalogoPoligono } from '../hooks/useCatalogoPoligono';
import { useCatalogoTabla } from '../hooks/useCatalogoTabla';
import { useCatalogoConsulta } from '../hooks/useCatalogoConsulta';
import { useCatalogoHexbin } from '../hooks/useCatalogoHexbin';
import { CONTEXTO_3D } from '../helpers/catalogo3d';
import { buildWmsLayer, HIGHLIGHT_STYLE, HIGHLIGHT_Z } from '../helpers/catalogoMapLayer';
import { BASEMAPS, RELIEF_OVERLAY, RELIEF_OVERLAY_Z_INDEX } from '@pages/maps/helpers/basemaps';
import { JALISCO_BOUNDS, hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { getMinZoom, ZOOM_ANIMATION_MS } from '@pages/maps/helpers/defaultView';
import { useScaleLineControl } from '@hooksMaps/useScaleLineControl';
import { useMapDrawing } from '@hooksMaps/useMapDrawing';
import { useMapEditing } from '@hooksMaps/useMapEditing';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';
import { useLayerLoading } from '@hooks/useLayerLoading';

const CATALOGO_ANNOTATIONS_KEY = 'mapalab.catalogo.annotations';

const CatalogoMapView = ({ capa, hexagonos = false, onHexbin = null, onEditInfobox = null }) => {
    const { tiempo, loop, wmsLayerRef } = useCatalogoTiempoContext();
    const targetRef = useRef(null);
    const scaleRef = useRef(null);
    const mapRef = useRef(null);
    const highlightSourceRef = useRef(null);
    const clickSeqRef = useRef(0);
    const [isLocating, setIsLocating] = useState(false);
    const [info, setInfo] = useState(null);
    const { loadingLayers, setLayerLoading } = useLayerLoading();
    const layerLoading = !!capa && loadingLayers.has(capa.slug);

    const { seleccion, consultar, cargarMas, limpiar, reposicionar } = useCatalogoPoligono({ mapRef, capa, tiempo });

    const clearInfo = useCallback(() => {
        setInfo(null);
        highlightSourceRef.current?.clear();
        limpiar();
    }, [limpiar]);

    const tabla = useCatalogoTabla({ capa, tiempo, setInfo, clearInfo });

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

    const consultarPunto = useCatalogoConsulta({ mapRef, wmsLayerRef, capaRef, clickSeqRef, highlightSourceRef, setInfo, clearInfo });
    const consultarPuntoRef = useRef(null);
    useEffect(() => {
        consultarPuntoRef.current = consultarPunto;
    }, [consultarPunto]);
    const consultar3d = useCallback(
        (_olMap, coordinate, evento) => consultarPunto(coordinate, evento?.point ? [evento.point.x, evento.point.y] : null),
        [consultarPunto],
    );

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
        ...tabla.contexto,
        ...CONTEXTO_3D,
    }), [isLocating, drawing, editing, tabla.contexto, tiempo.getSpecificFilter, loop.getLoopState, loop.stopLoop]);

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

        const handleClick = (evt) => {
            if (!isDrawingRef.current) consultarPuntoRef.current?.(evt.coordinate, evt.pixel);
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
        const layer = capa ? buildWmsLayer(capa) : null;
        if (!layer) return;
        map.addLayer(layer);
        wmsLayerRef.current = layer;

        const layerId = capa.slug;
        const source = layer.getSource();
        const onLoadStart = () => setLayerLoading(layerId, true);
        const onLoadEnd = () => setLayerLoading(layerId, false);
        source.on('imageloadstart', onLoadStart);
        source.on('imageloadend', onLoadEnd);
        source.on('imageloaderror', onLoadEnd);
        onLoadStart();

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
            onLoadEnd();
        };
    }, [capa, clearInfo, wmsLayerRef, setLayerLoading]);

    useCatalogoHexbin({ mapRef, wmsLayerRef, capa, tiempo, activo: hexagonos, onCambio: onHexbin });

    return (
        <>
            <div ref={targetRef} className="absolute inset-0" />

            <MapsContext.Provider value={mapsContextValue}>
                <View3dProvider>
                    <CatalogoTablaProviders tablasFijas={tabla.tablasFijas}>
                        <MapControls />
                        <CatalogoTools tabla={tabla} hayCapa={Boolean(capa)} />
                    </CatalogoTablaProviders>
                    <MapAttribution hideActions />
                    {capa && <CatalogoTimeBar tiempo={tiempo} loop={loop} />}
                    <CatalogoVista3d consultar={consultar3d} />
                </View3dProvider>
            </MapsContext.Provider>

            <div ref={scaleRef} className="fixed left-4 bottom-1 z-10" />

            {layerLoading && !loop.isLoopPlaying && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
                    <LottieSpinner loop autoplay className="w-32 h-32" />
                </div>
            )}

            {info?.medicion && (
                <div className="fixed left-1/2 top-1/2 z-20 w-[260px] -translate-x-1/2 -translate-y-1/2">
                    <PanelMedicionSeleccion geometria={info.medicion} onCerrar={clearInfo} />
                </div>
            )}

            {info && !info.medicion && capa && (
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
