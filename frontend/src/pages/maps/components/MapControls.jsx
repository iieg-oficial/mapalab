import { useMapsContext } from '@hooks/useMaps';
import { ZOOM_ANIMATION_MS } from '@pages/maps/helpers/defaultView';
import { useSiderAdaptivePosition, useSider } from '@contexts/SiderContext';
import { getFitPadding, ACTIVE_LAYERS_PANEL_WIDTH } from '@pages/maps/helpers/mapFit';
import { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { transformExtent, fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import { Fill, Stroke } from 'ol/style';
import Icon from '@components/Icon';
import { trackMapZoomLevel, trackGeolocate } from '@services/analyticsService';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import { useView3d } from '@contexts/View3dContext';
import Map3DBar from './Map3D/Map3DBar';
import Map3DAyuda from './Map3D/Map3DAyuda';
import Tooltip from '@components/Tooltip';
import icoNorte from '@icons/ico_n.svg';


const MapControls = ({ hideLocate = false }) => {
    const { mapRef, compareMode, paneMapRefs, isLocating, setIsLocating, municipioMode } = useMapsContext();
    const [hoveredButton, setHoveredButton] = useState(null);
    const { style, className } = useSiderAdaptivePosition({ bottomOffset: 180 });
    const { width: siderWidth, isMobile } = useSider();
    const { margenes } = useAreaUtil();
    const locationLayerRef = useRef(null);
    const isSwipe = !!compareMode?.active;
    const view3d = useView3d();
    const btn3dRef = useRef(null);
    const [barraTop, setBarraTop] = useState(0);
    useLayoutEffect(() => {
        const boton = btn3dRef.current;
        if (boton) setBarraTop(boton.offsetTop + boton.offsetHeight / 2);
    }, [view3d.active, view3d.available, hideLocate]);

    const view3dTitle = !view3d.available
        ? 'Tu navegador no tiene WebGL2, necesario para la vista 3D'
        : `Cambiar a vista ${view3d.active ? '2D' : '3D'}`;
    const get3d = useCallback(() => (view3d.active ? view3d.map3dRef.current : null), [view3d.active, view3d.map3dRef]);

    const getActiveMap = useCallback(() => {
        if (isSwipe) return paneMapRefs?.current?.[0]?.current ?? null;
        return mapRef?.current ?? null;
    }, [isSwipe, mapRef, paneMapRefs]);

    const handleZoomIn = useCallback(() => {
        const map3d = get3d();
        if (map3d) { map3d.zoomIn(); return; }
        const map = getActiveMap();
        if (!map) return;

        const view = map.getView();
        const currentZoom = view.getZoom();
        const maxZoom = view.getMaxZoom();

        if (currentZoom < maxZoom) {
            view.animate({ zoom: currentZoom + 1, duration: ZOOM_ANIMATION_MS });
            trackMapZoomLevel(currentZoom + 1);
        }
    }, [getActiveMap, get3d]);

    const handleZoomOut = useCallback(() => {
        const map3d = get3d();
        if (map3d) { map3d.zoomOut(); return; }
        const map = getActiveMap();
        if (!map) return;

        const view = map.getView();
        const currentZoom = view.getZoom();
        const minZoom = view.getMinZoom();

        if (currentZoom > minZoom) {
            view.animate({ zoom: currentZoom - 1, duration: ZOOM_ANIMATION_MS });
            trackMapZoomLevel(currentZoom - 1);
        }

    }, [getActiveMap, get3d]);

    const enMunicipio = !!municipioMode?.active && !!municipioMode?.scope?.type;

    const handleEncuadrar = useCallback(() => {
        const map3d = get3d();
        if (map3d) { map3d.fitBounds(JALISCO_BOUNDS.coords, { padding: 60, pitch: map3d.getPitch(), bearing: map3d.getBearing() }); return; }
        if (municipioMode?.active && municipioMode.centerOnSelection?.()) return;
        const map = getActiveMap();
        if (!map) return;
        const view = map.getView();
        const extent = transformExtent(JALISCO_BOUNDS.coords, 'EPSG:4326', 'EPSG:3857');
        const padding = getFitPadding({ mapSize: map.getSize(), siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
        view.fit(extent, { duration: 500, padding });
    }, [getActiveMap, siderWidth, isMobile, municipioMode, get3d]);

    const handleLocateMe = useCallback(() => {
        const primaryMap = getActiveMap();
        if (!primaryMap || !navigator.geolocation) return;

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const view = primaryMap.getView();
                const coords = [position.coords.longitude, position.coords.latitude];

                const transformedCoords = fromLonLat(coords);

                const targetMaps = isSwipe
                    ? [paneMapRefs?.current?.[0]?.current, paneMapRefs?.current?.[1]?.current].filter(Boolean)
                    : [primaryMap];

                if (locationLayerRef.current) {
                    const layers = Array.isArray(locationLayerRef.current) ? locationLayerRef.current : [locationLayerRef.current];
                    layers.forEach(layer => {
                        targetMaps.forEach(m => m.removeLayer(layer));
                    });
                }

                const newLayers = targetMaps.map(() => {
                    const locationFeature = new Feature({
                        geometry: new Point(transformedCoords)
                    });
                    locationFeature.setStyle(new Style({
                        image: new Circle({
                            radius: 8,
                            fill: new Fill({ color: '#f97316' }),
                            stroke: new Stroke({
                                color: '#ffffff',
                                width: 3
                            })
                        })
                    }));
                    return new VectorLayer({
                        source: new VectorSource({
                            features: [locationFeature]
                        }),
                        zIndex: 1000
                    });
                });

                targetMaps.forEach((m, i) => m.addLayer(newLayers[i]));
                locationLayerRef.current = newLayers.length === 1 ? newLayers[0] : newLayers;

                view.animate({
                    center: transformedCoords,
                    zoom: 14,
                    duration: 500
                });

                trackGeolocate('exito');
                setIsLocating(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                trackGeolocate('error');
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }, [getActiveMap, isSwipe, paneMapRefs, setIsLocating]);

    useEffect(() => {
        const mapInstance = mapRef.current;
        const paneRefs = paneMapRefs;

        return () => {
            const locationLayer = locationLayerRef.current;
            if (!locationLayer) return;

            const layers = Array.isArray(locationLayer) ? locationLayer : [locationLayer];
            const candidateMaps = [
                mapInstance,
                paneRefs?.current?.[0]?.current,
                paneRefs?.current?.[1]?.current,
            ].filter(Boolean);
            layers.forEach(layer => {
                candidateMaps.forEach(m => m.removeLayer(layer));
            });
        };
    }, [mapRef, paneMapRefs]);

    return (
        <div
            className={`fixed bottom-15 z-10 flex flex-col items-start gap-2 ${className}`}
            style={{
                ...style,
                left: `calc(${style?.left || '0px'} + ${margenes.left}px)`,
                bottom: `calc(3.75rem + ${margenes.bottom}px)`,
            }}
        >
            {view3d.active && (
                <Tooltip content="Orientar al norte">
                    <button
                        type="button"
                        onClick={() => view3d.setBearing(0)}
                        className="w-11 flex justify-center p-1 cursor-pointer"
                        aria-label="Orientar al norte"
                    >
                        <img
                            src={icoNorte}
                            alt=""
                            className="h-12 w-auto transition-transform duration-200"
                            style={{ transform: `rotate(${-view3d.bearing}deg)` }}
                        />
                    </button>
                </Tooltip>
            )}
            <div className="relative flex flex-col justify-center items-center rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A]">
                <button
                    onClick={handleZoomIn}
                    onMouseEnter={() => setHoveredButton('zoomin')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="p-2"
                    title="Acercar"
                    aria-label="Acercar zoom"
                >
                    <Icon
                        name="zoomin"
                        state={hoveredButton === 'zoomin' ? 'hover' : 'normal'}
                        className="w-6 h-6"
                    />
                </button>
                {!hideLocate && !view3d.active && (
                    <button
                        onClick={handleLocateMe}
                        onMouseEnter={() => setHoveredButton('center')}
                        onMouseLeave={() => setHoveredButton(null)}
                        disabled={isLocating}
                        className="p-2"
                        title="Mi ubicación"
                        aria-label="Ir a mi ubicación"
                    >
                        <Icon
                            name="center"
                            state={isLocating || hoveredButton === 'center' ? 'hover' : 'normal'}
                            className="w-6 h-6"
                        />
                    </button>
                )}
                <button
                    onClick={handleEncuadrar}
                    onMouseEnter={() => setHoveredButton('fit_extent')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="p-2"
                    title={enMunicipio ? `Encuadrar ${municipioMode.scopeLabel}` : 'Encuadrar Jalisco'}
                    aria-label={enMunicipio ? `Encuadrar la vista en ${municipioMode.scopeLabel}` : 'Encuadrar la vista en Jalisco'}
                >
                    <Icon
                        name="fit_extent"
                        state={hoveredButton === 'fit_extent' ? 'hover' : 'normal'}
                        className="w-6 h-6"
                    />
                </button>
                {view3d.present && !isSwipe && (
                    <Tooltip content={view3d.available ? <Map3DAyuda titulo={view3dTitle} /> : view3dTitle} placement="right" interactive>
                        <button
                            ref={btn3dRef}
                            type="button"
                            onClick={view3d.toggle}
                            disabled={!view3d.available}
                            aria-pressed={view3d.active}
                            className={`mx-1.5 my-0.5 size-8 rounded-full text-[13px] font-bold transition-colors ${view3d.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'} ${view3d.active ? 'bg-[#5C2472] text-white' : 'text-[#465055] hover:text-[#70308A]'}`}
                            title={view3dTitle}
                            aria-label={view3dTitle}
                        >
                        3D
                        </button>
                    </Tooltip>
                )}
                <button
                    onClick={handleZoomOut}
                    onMouseEnter={() => setHoveredButton('zoomout')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="p-2"
                    title="Alejar"
                    aria-label="Alejar zoom"
                >
                    <Icon
                        name="zoomout"
                        state={hoveredButton === 'zoomout' ? 'hover' : 'normal'}
                        className="w-6 h-6"
                    />
                </button>
                {view3d.active && (
                    <div className="absolute left-full" style={{ top: barraTop, transform: 'translateY(-50%)' }}>
                        <Map3DBar />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapControls;
