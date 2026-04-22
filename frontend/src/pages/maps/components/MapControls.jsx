import { useMapsContext } from '@hooks/useMaps';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
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

const isTouchDevice = () => 'ontouchstart' in window;

const MapControls = () => {
    const { mapRef, isLocating, setIsLocating } = useMapsContext();
    const [hoveredButton, setHoveredButton] = useState(null);
    const [showFitExtent, setShowFitExtent] = useState(false);
    const fitExtentTimeoutRef = useRef(null);
    const { style, className } = useSiderAdaptivePosition({ bottomOffset: 180 });
    const locationLayerRef = useRef(null);

    const handleZoomIn = useCallback(() => {
        if (!mapRef.current) return;

        const view = mapRef.current.getView();
        const currentZoom = view.getZoom();
        const maxZoom = view.getMaxZoom();

        if (currentZoom < maxZoom) {
            view.animate({ zoom: currentZoom + 1, duration: 250 });
            trackMapZoomLevel(currentZoom + 1);
        }
    }, [mapRef]);

    const handleZoomOut = useCallback(() => {
        if (!mapRef.current) return;

        const view = mapRef.current.getView();
        const currentZoom = view.getZoom();
        const minZoom = view.getMinZoom();

        if (currentZoom > minZoom) {
            view.animate({ zoom: currentZoom - 1, duration: 250 });
            trackMapZoomLevel(currentZoom - 1);
        }

        if (isTouchDevice()) {
            clearTimeout(fitExtentTimeoutRef.current);
            setShowFitExtent(true);
            fitExtentTimeoutRef.current = setTimeout(() => setShowFitExtent(false), 3000);
        }
    }, [mapRef]);

    const handleFitJalisco = useCallback(() => {
        if (!mapRef.current) return;
        const view = mapRef.current.getView();
        const extent = transformExtent(JALISCO_BOUNDS.coords, 'EPSG:4326', 'EPSG:3857');
        const size = mapRef.current.getSize();
        const shortSide = Math.min(size[0], size[1]);
        const pad = Math.round(shortSide * 0.08);
        view.fit(extent, { duration: 500, padding: [pad, pad, pad, pad] });
        setShowFitExtent(false);
    }, [mapRef]);

    const handleZoomOutEnter = useCallback(() => {
        if (isTouchDevice()) return;
        clearTimeout(fitExtentTimeoutRef.current);
        setHoveredButton('zoomout');
        setShowFitExtent(true);
    }, []);

    const handleFitExtentEnter = useCallback(() => {
        if (isTouchDevice()) return;
        clearTimeout(fitExtentTimeoutRef.current);
        setHoveredButton('fit_extent');
    }, []);

    const handleFitExtentLeave = useCallback(() => {
        if (isTouchDevice()) return;
        setHoveredButton(null);
        fitExtentTimeoutRef.current = setTimeout(() => setShowFitExtent(false), 300);
    }, []);

    const handleLocateMe = useCallback(() => {
        if (!mapRef.current || !navigator.geolocation) return;

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const view = mapRef.current.getView();
                const coords = [position.coords.longitude, position.coords.latitude];

                const transformedCoords = fromLonLat(coords);

                if (locationLayerRef.current) {
                    mapRef.current.removeLayer(locationLayerRef.current);
                }

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

                const locationLayer = new VectorLayer({
                    source: new VectorSource({
                        features: [locationFeature]
                    }),
                    zIndex: 1000
                });

                locationLayerRef.current = locationLayer;
                mapRef.current.addLayer(locationLayer);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapRef]);

    useEffect(() => {
        const mapInstance = mapRef.current;

        return () => {
            clearTimeout(fitExtentTimeoutRef.current);
            const locationLayer = locationLayerRef.current;

            if (locationLayer && mapInstance) {
                mapInstance.removeLayer(locationLayer);
            }
        };
    }, [mapRef]);

    return (
        <div
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
                    onClick={handleZoomOut}
                    onMouseEnter={handleZoomOutEnter}
                    onMouseLeave={() => { if (!isTouchDevice()) { setHoveredButton(null); handleFitExtentLeave(); } }}
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
            <div
                className={`transition-all duration-200 overflow-hidden ${showFitExtent ? 'w-10 opacity-100 ml-1.5' : 'w-0 opacity-0 ml-0'}`}
                onMouseEnter={handleFitExtentEnter}
                onMouseLeave={handleFitExtentLeave}
            >
                <button
                    onClick={handleFitJalisco}
                    className="p-2 bg-white rounded-full shadow-[0_5px_20px_#1A26641A]"
                    title="Centrar en Jalisco"
                    aria-label="Centrar vista en Jalisco"
                >
                    <Icon
                        name="fit_extent"
                        state={hoveredButton === 'fit_extent' ? 'hover' : 'normal'}
                        className="w-6 h-6"
                    />
                </button>
            </div>
        </div>
    );
};

export default MapControls;
