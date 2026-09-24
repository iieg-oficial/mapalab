import { useCallback, useMemo, useRef, useState } from 'react';
import { toLonLat } from 'ol/proj';
import { usePolygonSelection } from '@hooksMaps/usePolygonSelection';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';

export const useCatalogoPoligono = ({ mapRef, capa, tiempo }) => {
    const pageRef = useRef(null);
    const [seleccion, setSeleccion] = useState(null);

    const layerId = capa?.geoserverLayer || capa?.slug || null;

    const capaLayers = useMemo(() => {
        if (!capa || !layerId) return [];
        const wmsConfig = hydrateWmsConfig({
            geoserverWorkspace: capa.geoserverWorkspace,
            geoserverLayer: capa.geoserverLayer,
        });
        if (!wmsConfig) return [];
        return [{ id: layerId, label: capa.nombre, wmsConfig }];
    }, [capa, layerId]);

    const getFilter = useCallback(
        () => (tiempo?.isRaster ? null : tiempo?.filtroMapa || null),
        [tiempo?.isRaster, tiempo?.filtroMapa],
    );

    const { queryPolygon, loadMorePage } = usePolygonSelection({ getFilter, pageRef });

    const limpiar = useCallback(() => {
        pageRef.current = null;
        setSeleccion(null);
    }, []);

    const consultar = useCallback(async (geometry, centerCoordinate, onFeatureCountUpdate) => {
        const map = mapRef.current;
        if (!map || capaLayers.length === 0) return null;

        const activeLayers = [{ id: layerId, name: capa?.nombre, visible: true }];

        try {
            const page = await queryPolygon({
                map,
                polygonGeometry: geometry,
                activeLayers,
                allLayers: capaLayers,
            });

            const features = (page?.results || []).flatMap((result) => result.features);
            const [lng, lat] = toLonLat(centerCoordinate);
            const base = {
                pixel: map.getPixelFromCoordinate(centerCoordinate),
                lngLat: { lng, lat },
                geometria: geometry.clone(),
            };

            if (features.length === 0) {
                onFeatureCountUpdate?.(0);
                pageRef.current = null;
                setSeleccion({ ...base, features: [], hasMore: false, matched: 0 });
                return null;
            }

            onFeatureCountUpdate?.(
                Math.max(page.matched || 0, features.length),
                [{ name: capa?.nombre, count: features.length }],
                page.results,
            );

            setSeleccion({
                ...base,
                features,
                hasMore: page.hasMore,
                matched: page.matched,
            });
            return page;
        } catch {
            limpiar();
            return null;
        }
    }, [mapRef, capaLayers, layerId, capa, queryPolygon, limpiar]);

    const cargarMas = useCallback(async () => {
        const page = await loadMorePage();
        const nuevas = (page?.results || []).flatMap((result) => result.features);

        if (nuevas.length === 0) {
            setSeleccion((prev) => (prev ? { ...prev, hasMore: false } : prev));
            return 0;
        }

        setSeleccion((prev) => (prev
            ? { ...prev, features: [...prev.features, ...nuevas], hasMore: page.hasMore }
            : prev));
        return nuevas.length;
    }, [loadMorePage]);

    const reposicionar = useCallback((pixel) => {
        setSeleccion((prev) => (prev ? { ...prev, pixel } : prev));
    }, []);

    return { seleccion, consultar, cargarMas, limpiar, reposicionar };
};
