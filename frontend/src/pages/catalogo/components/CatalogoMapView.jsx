import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import ImageWMS from 'ol/source/ImageWMS';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import { fromLonLat, transformExtent } from 'ol/proj';
import MapsContext from '@contexts/MapsContext';
import { SiderContext } from '@contexts/SiderContext';
import MapControls from '@pages/maps/components/MapControls';
import MapAttribution from '@pages/maps/components/MapAttribution';
import CatalogoInfoButton from './CatalogoInfoButton';
import CatalogoInfoBox from './CatalogoInfoBox';
import CatalogoTools from './CatalogoTools';
import { BASEMAPS, RELIEF_OVERLAY, RELIEF_OVERLAY_Z_INDEX } from '@pages/maps/helpers/basemaps';
import { JALISCO_BOUNDS, hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { getMinZoom } from '@pages/maps/helpers/defaultView';
import { useScaleLineControl } from '@hooksMaps/useScaleLineControl';
import { useMapDrawing } from '@hooksMaps/useMapDrawing';
import { useMapEditing } from '@hooksMaps/useMapEditing';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';
import { trackCatalogoFeatureClick } from '@services/analyticsService';

const buildWmsLayer = (capa) => {
    const cfg = hydrateWmsConfig({
        geoserverWorkspace: capa.geoserverWorkspace,
        geoserverLayer: capa.geoserverLayer,
    });
    if (!cfg) return null;
    const source = new ImageWMS({
        url: cfg.baseUrl,
        params: {
            LAYERS: cfg.layerName,
            FORMAT: cfg.format,
            TRANSPARENT: cfg.transparent,
            VERSION: cfg.version,
            SRS: cfg.srs,
        },
        ratio: 1.5,
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
    });
    return new ImageLayer({ source, zIndex: 5 });
};

const geojson = new GeoJSON();

const HIGHLIGHT_Z = 998;

const HIGHLIGHT_STYLE = new Style({
    stroke: new Stroke({ color: '#FF8300', width: 2.5, lineCap: 'round', lineJoin: 'round' }),
    fill: new Fill({ color: 'rgba(255, 131, 0, 0.18)' }),
    image: new CircleStyle({
        radius: 8,
        stroke: new Stroke({ color: '#FF8300', width: 2 }),
        fill: new Fill({ color: 'rgba(255, 131, 0, 0.18)' }),
    }),
});

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

const CatalogoMapView = ({ capa }) => {
    const targetRef = useRef(null);
    const scaleRef = useRef(null);
    const mapRef = useRef(null);
    const wmsLayerRef = useRef(null);
    const highlightSourceRef = useRef(null);
    const clickSeqRef = useRef(0);
    const [isLocating, setIsLocating] = useState(false);
    const [info, setInfo] = useState(null);

    const clearInfo = useCallback(() => {
        setInfo(null);
        highlightSourceRef.current?.clear();
    }, []);

    const getMapInstance = useCallback(() => mapRef.current, []);
    useScaleLineControl(getMapInstance, scaleRef);

    const drawing = useMapDrawing(mapRef, null, null, { storageKey: CATALOGO_ANNOTATIONS_KEY });
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
        ...drawing,
        ...editing,
    }), [isLocating, drawing, editing]);

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
            }),
            controls: [],
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
                { INFO_FORMAT: 'application/json', FEATURE_COUNT: 20 },
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
                setInfo({ features, pixel });
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
    }, [clearInfo]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        clearInfo();
        if (wmsLayerRef.current) {
            map.removeLayer(wmsLayerRef.current);
            wmsLayerRef.current = null;
        }
        if (!capa) return;
        const layer = buildWmsLayer(capa);
        if (!layer) return;
        map.addLayer(layer);
        wmsLayerRef.current = layer;

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
        return () => { cancelled = true; };
    }, [capa, clearInfo]);

    return (
        <>
            <div ref={targetRef} className="absolute inset-0" />

            <MapsContext.Provider value={mapsContextValue}>
                <SiderContext.Provider value={SIDER_STUB}>
                    <MapControls />
                    <CatalogoTools />
                </SiderContext.Provider>
                <MapAttribution hideActions extraRight={<CatalogoInfoButton />} />
            </MapsContext.Provider>

            <div ref={scaleRef} className="fixed left-4 bottom-1 z-10" />

            {info && capa && (
                <CatalogoInfoBox
                    capa={capa}
                    features={info.features}
                    pixel={info.pixel}
                    onClose={clearInfo}
                />
            )}
        </>
    );
};

export default CatalogoMapView;
