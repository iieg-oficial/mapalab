import { useCallback, useRef, useEffect } from 'react';
import { fromLonLat, toLonLat } from 'ol/proj';

const MARKER_Z_INDEX = 999;

let olModules = null;
const loadOLModules = async () => {
    if (olModules) return olModules;
    const [
        { default: VectorLayer },
        { default: VectorSource },
        { default: Feature },
        { default: Point },
        { default: Style },
        { default: IconStyle },
        { default: CircleStyle },
        { Fill }
    ] = await Promise.all([
        import('ol/layer/Vector'),
        import('ol/source/Vector'),
        import('ol/Feature'),
        import('ol/geom/Point'),
        import('ol/style/Style'),
        import('ol/style/Icon'),
        import('ol/style/Circle'),
        import('ol/style')
    ]);
    olModules = { VectorLayer, VectorSource, Feature, Point, Style, IconStyle, CircleStyle, Fill };
    return olModules;
};

export const useMapMarker = (mapRef, { setSelectedFeatureInfo, clickPosition } = {}) => {
    const markersRef = useRef(new Map());
    const timersRef = useRef(new Map());
    const markerClickedRef = useRef(false);

    const hideMarker = useCallback((id = '_default') => {
        const layer = markersRef.current.get(id);
        if (layer && mapRef.current) {
            mapRef.current.removeLayer(layer);
            markersRef.current.delete(id);
        }
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, [mapRef]);

    const hideAllMarkers = useCallback(() => {
        markersRef.current.forEach((_, id) => hideMarker(id));
    }, [hideMarker]);

    const showMarker = useCallback(async ({ id = '_default', center, zoom, icon, scale = 1, duration, anchor = [0.5, 1], minZoom, maxZoom, bgColor, bgRadius = 18, infoBox } = {}) => {
        if (!mapRef.current || !center) return;

        hideMarker(id);

        const { VectorLayer, VectorSource, Feature, Point, Style, IconStyle, CircleStyle, Fill } = await loadOLModules();

        const coords = fromLonLat(center);
        const feature = new Feature({ geometry: new Point(coords) });
        if (infoBox) feature.set('markerInfoBox', infoBox);

        if (icon) {
            const styles = [];
            if (bgColor) {
                styles.push(new Style({
                    image: new CircleStyle({
                        radius: bgRadius,
                        fill: new Fill({ color: bgColor })
                    })
                }));
            }
            styles.push(new Style({
                image: new IconStyle({
                    src: icon,
                    scale,
                    anchor
                })
            }));
            feature.setStyle(styles);
        }

        const layerOptions = {
            source: new VectorSource({ features: [feature] }),
            zIndex: MARKER_Z_INDEX
        };
        if (minZoom != null) layerOptions.minZoom = minZoom;
        if (maxZoom != null) layerOptions.maxZoom = maxZoom;

        const layer = new VectorLayer(layerOptions);

        mapRef.current.addLayer(layer);
        markersRef.current.set(id, layer);

        if (zoom) {
            mapRef.current.getView().animate({
                center: coords,
                zoom,
                duration: 500
            });
        }

        if (duration) {
            const timer = setTimeout(() => hideMarker(id), duration);
            timersRef.current.set(id, timer);
        }
    }, [mapRef, hideMarker]);

    const showMarkers = useCallback(async (markers = []) => {
        for (const marker of markers) {
            await showMarker(marker);
        }
    }, [showMarker]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !setSelectedFeatureInfo || !clickPosition) return;

        const handleClick = (evt) => {
            markerClickedRef.current = false;
            map.forEachFeatureAtPixel(evt.pixel, (feature) => {
                if (markerClickedRef.current) return;
                const infoBox = feature.get('markerInfoBox');
                if (!infoBox) return;
                markerClickedRef.current = true;

                const coord = feature.getGeometry().getCoordinates();
                const pixel = map.getPixelFromCoordinate(coord);
                clickPosition.updatePosition({ pixel });

                const [lng, lat] = toLonLat(coord);
                setSelectedFeatureInfo({
                    lngLat: { lng, lat },
                    results: [{
                        layerId: `marker_${infoBox.layerName}`,
                        layerName: infoBox.layerName,
                        features: [{
                            id: `marker_${infoBox.layerName}`,
                            properties: infoBox.properties
                        }],
                        totalFeatures: 1,
                        littleCard: infoBox.littleCard
                    }]
                });
            });
        };

        map.on('click', handleClick);
        return () => map.un('click', handleClick);
    }, [mapRef, setSelectedFeatureInfo, clickPosition]);

    return { showMarker, showMarkers, hideMarker, hideAllMarkers, markerClickedRef };
};
