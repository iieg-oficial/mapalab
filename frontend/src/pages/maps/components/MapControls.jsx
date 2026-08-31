import { useMapsContext } from '@hooks/useMaps';
import { ZOOM_ANIMATION_MS } from '@pages/maps/helpers/defaultView';
import { useSiderAdaptivePosition, useSider } from '@contexts/SiderContext';
import { getFitPadding, ACTIVE_LAYERS_PANEL_WIDTH } from '@pages/maps/helpers/mapFit';
import { useCallback, useState, useEffect, useRef } from 'react';
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


const MapControls = () => {
    const { mapRef, compareMode, paneMapRefs, isLocating, setIsLocating, municipioMode } = useMapsContext();
    const [hoveredButton, setHoveredButton] = useState(null);
    const { style, className } = useSiderAdaptivePosition({ bottomOffset: 180 });
    const { width: siderWidth, isMobile } = useSider();
    const locationLayerRef = useRef(null);
    const isSwipe = !!compareMode?.active;

    const getActiveMap = useCallback(() => {
        if (isSwipe) return paneMapRefs?.current?.[0]?.current ?? null;
        return mapRef?.current ?? null;
    }, [isSwipe, mapRef, paneMapRefs]);

    const handleZoomIn = useCallback(() => {
        const map = getActiveMap();
        if (!map) return;

        const view = map.getView();
        const currentZoom = view.getZoom();
        const maxZoom = view.getMaxZoom();

        if (currentZoom < maxZoom) {
            view.animate({ zoom: currentZoom + 1, duration: ZOOM_ANIMATION_MS });
            trackMapZoomLevel(currentZoom + 1);
        }
    }, [getActiveMap]);

    const handleZoomOut = useCallback(() => {
        const map = getActiveMap();
        if (!map) return;

        const view = map.getView();
        const currentZoom = view.getZoom();
        const minZoom = view.getMinZoom();

        if (currentZoom > minZoom) {
            view.animate({ zoom: currentZoom - 1, duration: ZOOM_ANIMATION_MS });
            trackMapZoomLevel(currentZoom - 1);
        }

    }, [getActiveMap]);

    const enMunicipio = !!municipioMode?.active && !!municipioMode?.scope?.type;

    const handleEncuadrar = useCallback(() => {
        if (municipioMode?.active && municipioMode.centerOnSelection?.()) return;
        const map = getActiveMap();
        if (!map) return;
        const view = map.getView();
        const extent = transformExtent(JALISCO_BOUNDS.coords, 'EPSG:4326', 'EPSG:3857');
        const padding = getFitPadding({ mapSize: map.getSize(), siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
        view.fit(extent, { duration: 500, padding });
    }, [getActiveMap, siderWidth, isMobile, municipioMode]);

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
            data-controles-mapa
            className={`fixed bottom-15 z-10 flex items-end ${className}`}
            style={style}
        >
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
            </div>
        </div>
    );
};

export default MapControls;
