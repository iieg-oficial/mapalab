import { useMapsContext } from '@hooks/useMaps';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useCallback, useState, useEffect, useRef } from 'react';

const MapControls = () => {
    const { mapRef } = useMapsContext();
    const [isLocating, setIsLocating] = useState(false);
    const { style, className } = useSiderAdaptivePosition({ bottomOffset: 180 });
    const locationLayerRef = useRef(null);

    const handleZoomIn = useCallback(() => {
        if (!mapRef.current) return;

        const view = mapRef.current.getView();
        const currentZoom = view.getZoom();
        const maxZoom = view.getMaxZoom();

        if (currentZoom < maxZoom) {
            view.animate({
                zoom: currentZoom + 1,
                duration: 250
            });
        }
    }, [mapRef]);

    const handleZoomOut = useCallback(() => {
        if (!mapRef.current) return;

        const view = mapRef.current.getView();
        const currentZoom = view.getZoom();
        const minZoom = view.getMinZoom();

        if (currentZoom > minZoom) {
            view.animate({
                zoom: currentZoom - 1,
                duration: 250
            });
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

                setIsLocating(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }, [mapRef]);

    const [isGeolocationAvailable, setIsGeolocationAvailable] = useState(false);

    useEffect(() => {
        setIsGeolocationAvailable('geolocation' in navigator);
    }, []);

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
            className={`fixed bottom-15 z-10 flex flex-col gap-2 ${className}`}
            style={style}
        >
            <div className="flex flex-col rounded-xl shadow bg-white/80  backdrop-blur-sm">
                <button
                    onClick={handleZoomIn}
                    className="px-3 py-2 text-zinc-700  hover:bg-zinc-100/80  transition-colors rounded-t-xl border-b border-zinc-200 "
                    title="Acercar"
                    aria-label="Acercar zoom"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </button>
                <button
                    onClick={handleZoomOut}
                    className="px-3 py-2 text-zinc-700  hover:bg-zinc-100/80  transition-colors rounded-b-xl"
                    title="Alejar"
                    aria-label="Alejar zoom"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                        />
                    </svg>
                </button>
            </div>

            {isGeolocationAvailable && (
                <button
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="px-3 py-2 rounded-xl shadow bg-white/80  backdrop-blur-sm text-zinc-700  hover:bg-zinc-100/80  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Mi ubicación"
                    aria-label="Ir a mi ubicación"
                >
                    {isLocating ? (
                        <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
};

export default MapControls;
