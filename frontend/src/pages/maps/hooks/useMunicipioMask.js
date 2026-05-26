import { useEffect, useRef } from 'react';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Feature } from 'ol';
import { Style, Fill, Stroke } from 'ol/style';
import { buildMaskPolygon } from '@pages/maps/helpers/municipioMask';

const MASK_Z_INDEX = 9500;

const MASK_STYLE = new Style({
    fill: new Fill({ color: 'rgba(0, 0, 0, 0.85)' }),
    stroke: new Stroke({ color: 'rgba(0, 0, 0, 0)', width: 0 }),
});

const createMaskLayer = () => {
    const source = new VectorSource();
    const layer = new VectorLayer({
        source,
        style: MASK_STYLE,
        zIndex: MASK_Z_INDEX,
        updateWhileAnimating: false,
        updateWhileInteracting: false,
        properties: { isMunicipioMask: true },
    });
    return { source, layer };
};

const attachMaskToMap = (map, geometriesRef) => {
    if (!map) return null;
    const { source, layer } = createMaskLayer();
    map.addLayer(layer);
    const feature = new Feature();
    source.addFeature(feature);

    const updateMaskGeometry = () => {
        const view = map.getView();
        const size = map.getSize();
        if (!view || !size) return;
        const extent = view.calculateExtent(size);
        const geometries = (geometriesRef.current || []).map(m => m.geometry).filter(Boolean);
        const poly = buildMaskPolygon(extent, geometries, 0.5);
        if (poly) {
            feature.setGeometry(poly);
        } else {
            feature.setGeometry(null);
        }
    };

    const view = map.getView();
    const onMoveEnd = () => updateMaskGeometry();
    const onChangeResolution = () => updateMaskGeometry();
    map.on('moveend', onMoveEnd);
    view?.on('change:resolution', onChangeResolution);
    updateMaskGeometry();

    return {
        layer,
        source,
        feature,
        update: updateMaskGeometry,
        detach: () => {
            map.un('moveend', onMoveEnd);
            view?.un('change:resolution', onChangeResolution);
            try {
                map.removeLayer(layer);
            } catch (err) {
                console.debug('No se pudo remover capa de máscara', err);
            }
        },
    };
};

export const useMunicipioMask = ({ active, geometries, mapRef, paneMapInstances }) => {
    const handlesRef = useRef(new Map());
    const geometriesRef = useRef(geometries);

    useEffect(() => {
        geometriesRef.current = geometries;
        handlesRef.current.forEach(handle => handle.update());
    }, [geometries]);

    useEffect(() => {
        if (!active) {
            handlesRef.current.forEach(handle => handle.detach());
            handlesRef.current.clear();
            return undefined;
        }

        const targets = new Map();
        const liveMap = mapRef?.current;
        if (liveMap) targets.set(liveMap, true);
        if (paneMapInstances) {
            Object.values(paneMapInstances).forEach(m => {
                if (m) targets.set(m, true);
            });
        }

        targets.forEach((_v, map) => {
            if (!handlesRef.current.has(map)) {
                const handle = attachMaskToMap(map, geometriesRef);
                if (handle) handlesRef.current.set(map, handle);
            }
        });

        const currentTargets = new Set(targets.keys());
        [...handlesRef.current.keys()].forEach(map => {
            if (!currentTargets.has(map)) {
                handlesRef.current.get(map)?.detach();
                handlesRef.current.delete(map);
            }
        });

        return undefined;
    }, [active, mapRef, paneMapInstances]);

    useEffect(() => () => {
        handlesRef.current.forEach(handle => handle.detach());
        handlesRef.current.clear();
    }, []);
};
