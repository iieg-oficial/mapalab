import { useMapsContext } from '@hooks/useMaps';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useCallback, useState, useEffect, useRef } from 'react';
import Icon from '@components/Icon';
import { trackMapZoomLevel, trackGeolocate } from '@services/analyticsService';

const MapControls = () => {
    const { mapRef, isLocating, setIsLocating } = useMapsContext();
    const [hoveredButton, setHoveredButton] = useState(null);
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
    }, [mapRef]);

    const handleLocateMe = useCallback(() => {
        if (!mapRef.current || !navigator.geolocation) return;

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const view = mapRef.current.getView();
                const coords = [position.coords.longitude, position.coords.latitude];

                const [
                    { fromLonLat },
                    { default: VectorLayer },
                    { default: VectorSource },
                    { default: Feature },
                    { default: Point },
                    { default: Style },
                    { default: Circle },
                    { Fill, Stroke }
                ] = await Promise.all([
                    import('ol/proj'),
                    import('ol/layer/Vector'),
                    import('ol/source/Vector'),
                    import('ol/Feature'),
                    import('ol/geom/Point'),
                    import('ol/style/Style'),
                    import('ol/style/Circle'),
                    import('ol/style')
                ]);

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
                        fill: new Fill({ color: '#3b82f6' }),
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

                trackGeolocate('success');
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
    }, [mapRef]);

    useEffect(() => {
        const mapInstance = mapRef.current;

        return () => {
            const locationLayer = locationLayerRef.current;

            if (locationLayer && mapInstance) {
                mapInstance.removeLayer(locationLayer);
            }
        };
    }, [mapRef]);

    return (
        <div
            className={`fixed bottom-15 z-10 flex flex-col w-10 ${className}`}
            style={style}
        >
            <div className="flex flex-col justify-center items-center rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A]">
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
