import { useCallback, useRef } from 'react';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import IconStyle from 'ol/style/Icon';
import CircleStyle from 'ol/style/Circle';
import { Fill } from 'ol/style';

const MARKER_Z_INDEX = 999;

export const useMapMarker = (mapRef, paneMapRefs, compareModeRef, { setSelectedFeatureInfo, clickPosition } = {}) => {
    const markersRef = useRef(new Map());
    const timersRef = useRef(new Map());
    const markerClickedRef = useRef(false);

    const getActiveMap = useCallback(() => {
        if (compareModeRef?.current?.active) {
            return paneMapRefs?.current?.[0]?.current ?? null;
        }
        return mapRef?.current ?? null;
    }, [mapRef, paneMapRefs, compareModeRef]);

    const hideMarker = useCallback((id = '_default') => {
        const layer = markersRef.current.get(id);
        const map = getActiveMap();
        if (layer && map) {
            map.removeLayer(layer);
            markersRef.current.delete(id);
        }
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, [getActiveMap]);

    const hideAllMarkers = useCallback(() => {
        markersRef.current.forEach((_, id) => hideMarker(id));
    }, [hideMarker]);

    const openMarkerCard = useCallback((feature, mapInstance) => {
        const map = mapInstance || getActiveMap();
        if (!map || !setSelectedFeatureInfo || !clickPosition) return;
        const infoBox = feature.get('markerInfoBox');
        if (!infoBox) return;

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
    }, [getActiveMap, setSelectedFeatureInfo, clickPosition]);

    const showMarker = useCallback(async ({ id = '_default', center, zoom, icon, scale = 1, duration, anchor = [0.5, 1], minZoom, maxZoom, bgColor, bgRadius = 18, infoBox, openOnShow = false, zIndex = MARKER_Z_INDEX } = {}) => {
        const map = getActiveMap();
        if (!map || !center) return;

        hideMarker(id);

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
            zIndex
        };
        if (minZoom != null) layerOptions.minZoom = minZoom;
        if (maxZoom != null) layerOptions.maxZoom = maxZoom;

        const layer = new VectorLayer(layerOptions);

        map.addLayer(layer);
        markersRef.current.set(id, layer);

        const finalize = () => {
            if (openOnShow && infoBox) openMarkerCard(feature);
        };

        if (zoom) {
            map.getView().animate({
                center: coords,
                zoom,
                duration: 500
            }, finalize);
        } else {
            finalize();
        }

        if (duration) {
            const timer = setTimeout(() => hideMarker(id), duration);
            timersRef.current.set(id, timer);
        }
    }, [getActiveMap, hideMarker, openMarkerCard]);

    const showMarkers = useCallback(async (markers = []) => {
        for (const marker of markers) {
            await showMarker(marker);
        }
    }, [showMarker]);

    return { showMarker, showMarkers, hideMarker, hideAllMarkers, markerClickedRef, openMarkerCard };
};
