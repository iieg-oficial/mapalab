import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { fromLonLat, transformExtent } from 'ol/proj';
import MapsContext from '@contexts/MapsContext';
import { SiderContext } from '@contexts/SiderContext';
import MapControls from '@pages/maps/components/MapControls';
import MapAttribution from '@pages/maps/components/MapAttribution';
import { BASEMAPS, RELIEF_OVERLAY, RELIEF_OVERLAY_Z_INDEX } from '@pages/maps/helpers/basemaps';
import { JALISCO_BOUNDS, hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { getMinZoom } from '@pages/maps/helpers/defaultView';
import { useScaleLineControl } from '@hooksMaps/useScaleLineControl';
import { getLayerExtent3857 } from '@services/wmsCapabilitiesService';

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
    const [isLocating, setIsLocating] = useState(false);

    const getMapInstance = useCallback(() => mapRef.current, []);
    useScaleLineControl(getMapInstance, scaleRef);

    const mapsContextValue = useMemo(() => ({
        mapRef,
        baseMapId: 'voyager',
        compareMode: null,
        paneMapRefs: { current: [] },
        isLocating,
        setIsLocating,
    }), [isLocating]);

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
        return () => {
            map.setTarget(undefined);
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
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
    }, [capa]);

    return (
        <>
            <div ref={targetRef} className="absolute inset-0" />

            <MapsContext.Provider value={mapsContextValue}>
                <SiderContext.Provider value={SIDER_STUB}>
                    <MapControls />
                </SiderContext.Provider>
                <MapAttribution hideActions />
            </MapsContext.Provider>

            <div ref={scaleRef} className="fixed left-4 bottom-1 z-10" />
        </>
    );
};

export default CatalogoMapView;
