import { useCallback, useMemo } from 'react';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';

const GEOMETRIAS_CON_TABLA = new Set(['point', 'line', 'polygon']);

export const idTablaCatalogo = (capa) => (capa ? `catalogo:${capa.slug}` : null);

export const useCatalogoTabla = ({ capa, tiempo, setInfo, clearInfo }) => {
    const layerId = idTablaCatalogo(capa);
    const disponible = Boolean(capa) && !tiempo.isRaster && GEOMETRIAS_CON_TABLA.has(tiempo.geometria);

    const layerDef = useMemo(() => {
        if (!capa) return null;
        return {
            id: layerId,
            name: capa.nombre,
            label: capa.nombre,
            geometryType: tiempo.geometria,
            littleCard: capa.littleCard || null,
            wmsConfig: hydrateWmsConfig({
                workspace: capa.geoserverWorkspace,
                geoserverWorkspace: capa.geoserverWorkspace,
                geoserverLayer: capa.geoserverLayer,
            }),
        };
    }, [capa, layerId, tiempo.geometria]);

    const tablasFijas = useMemo(
        () => (disponible ? [{ id: layerId, nombre: capa.nombre, visible: true, childIds: [layerId] }] : []),
        [capa, disponible, layerId],
    );

    const { applyFilter: aplicarTiempo, clearFilter: limpiarTiempo, getLayerFilters: filtrosTiempo, filtroMapa } = tiempo;

    const applyFilter = useCallback((id, nombre, cql) => {
        if (id === layerId) aplicarTiempo(id, nombre, cql);
    }, [aplicarTiempo, layerId]);

    const clearFilter = useCallback((id, nombre) => {
        if (id === layerId) limpiarTiempo(id, nombre);
    }, [limpiarTiempo, layerId]);

    const getLayerFilters = useCallback((id) => (id === layerId ? filtrosTiempo() : {}), [filtrosTiempo, layerId]);

    const getFilter = useCallback((id) => (id === layerId ? filtroMapa : null), [filtroMapa, layerId]);

    const setSelectedFeatureInfo = useCallback((seleccion) => {
        if (!seleccion) {
            clearInfo();
            return;
        }
        if (seleccion.medicion) {
            setInfo({ medicion: seleccion.medicion });
            return;
        }
        setInfo({
            features: seleccion.results?.[0]?.features || [],
            pixel: [window.innerWidth / 2, window.innerHeight / 2],
            lngLat: seleccion.lngLat,
        });
    }, [clearInfo, setInfo]);

    const contexto = useMemo(() => ({
        allLayers: layerDef ? [layerDef] : [],
        activeLayerIds: layerDef ? [layerId] : [],
        groupedActiveLayers: layerDef ? [layerDef] : [],
        selectedLayer: layerDef,
        hiddenLayerIds: [],
        municipioMode: null,
        applyFilter,
        clearFilter,
        getLayerFilters,
        getFilter,
        setSelectedFeatureInfo,
    }), [applyFilter, clearFilter, getFilter, getLayerFilters, layerDef, layerId, setSelectedFeatureInfo]);

    return { layerId, disponible, tablasFijas, contexto };
};
