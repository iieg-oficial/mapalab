import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';
import { fetchGeometryType } from '@utils/featureInfoUtils';
import { getLayerTimePeriodicity } from '@services/wmsCapabilitiesService';
import { RASTER_WORKSPACES } from '@services/downloadUrls';
import { fetchCapaPeriodicidad } from '@services/catalogoService';
import { LLAVE_SELECCION, LLAVE_TABLA, combinar } from '@pages/maps/helpers/tablaCqlBuilder';

const FILTER_NAME = 'date';
const FILTROS_TABLA = new Set([LLAVE_TABLA, LLAVE_SELECCION]);

const getYears = (fecha) => {
    if (!fecha || typeof fecha !== 'object') return [];
    return Object.keys(fecha).map(Number).filter(Number.isFinite).sort((a, b) => b - a);
};

const latestRasterDate = (fecha) => {
    const years = getYears(fecha);
    if (!years.length) return null;
    const yData = fecha[years[0]];
    if (typeof yData === 'string') return yData;
    const months = Object.keys(yData).map(Number).sort((a, b) => b - a);
    return months.length ? yData[months[0]] : null;
};

export const useCatalogoTiempo = (capa, wmsLayerRef, { initialFilter = null, onFilterChange } = {}) => {
    const [periodicidad, setPeriodicidad] = useState(null);
    const [loading, setLoading] = useState(false);
    const [geometria, setGeometria] = useState(null);
    const [filtro, setFiltro] = useState(null);
    const [filtrosTabla, setFiltrosTabla] = useState({});
    const defaultAplicadoRef = useRef(null);
    const initialFilterRef = useRef(initialFilter);
    initialFilterRef.current = initialFilter;
    const onFilterChangeRef = useRef(onFilterChange);
    onFilterChangeRef.current = onFilterChange;

    const layerId = capa?.slug || null;
    const isRaster = !!capa && RASTER_WORKSPACES.has(capa.geoserverWorkspace);

    useEffect(() => {
        setPeriodicidad(null);
        setGeometria(null);
        setFiltro(null);
        setFiltrosTabla({});
        defaultAplicadoRef.current = null;
        if (!capa) return undefined;

        const ctrl = new AbortController();
        setLoading(true);

        if (RASTER_WORKSPACES.has(capa.geoserverWorkspace)) {
            setGeometria('raster');
            const cfg = hydrateWmsConfig({
                geoserverWorkspace: capa.geoserverWorkspace,
                geoserverLayer: capa.geoserverLayer,
            });
            getLayerTimePeriodicity(cfg)
                .then((fecha) => setPeriodicidad(fecha))
                .catch(() => setPeriodicidad(null))
                .finally(() => setLoading(false));
            return () => ctrl.abort();
        }

        fetchCapaPeriodicidad(capa, ctrl.signal)
            .then((data) => setPeriodicidad(data?.fecha || data || null))
            .catch(() => setPeriodicidad(null))
            .finally(() => setLoading(false));

        const cfg = hydrateWmsConfig({
            geoserverWorkspace: capa.geoserverWorkspace,
            geoserverLayer: capa.geoserverLayer,
        });
        if (cfg) {
            fetchGeometryType(cfg.baseUrl, cfg.layerName)
                .then((tipo) => setGeometria(tipo))
                .catch(() => setGeometria('unknown'));
        }

        return () => ctrl.abort();
    }, [capa]);

    const years = useMemo(() => getYears(periodicidad), [periodicidad]);
    const hasPeriodicidad = years.length > 0;

    const applyFilter = useCallback((_layerId, filterName, cqlFilter) => {
        if (FILTROS_TABLA.has(filterName)) {
            setFiltrosTabla((previos) => ({ ...previos, [filterName]: cqlFilter || null }));
            return;
        }
        setFiltro(cqlFilter || null);
    }, []);

    const clearFilter = useCallback((_layerId, filterName) => {
        if (FILTROS_TABLA.has(filterName)) {
            setFiltrosTabla((previos) => {
                if (!(filterName in previos)) return previos;
                const siguientes = { ...previos };
                delete siguientes[filterName];
                return siguientes;
            });
            return;
        }
        setFiltro(null);
    }, []);

    const getSpecificFilter = useCallback(
        (_layerId, filterName) => (filterName === FILTER_NAME ? filtro : filtrosTabla[filterName] || null),
        [filtro, filtrosTabla],
    );

    const getLayerFilters = useCallback(() => Object.fromEntries(
        Object.entries({ [FILTER_NAME]: isRaster ? null : filtro, ...filtrosTabla }).filter(([, cql]) => cql),
    ), [filtro, filtrosTabla, isRaster]);

    const filtroMapa = useMemo(
        () => (isRaster ? null : combinar([filtro, ...Object.values(filtrosTabla)])),
        [filtro, filtrosTabla, isRaster],
    );

    const getPeriodicity = useCallback(() => periodicidad, [periodicidad]);

    useEffect(() => {
        if (!hasPeriodicidad || !geometria || defaultAplicadoRef.current === layerId) return;
        defaultAplicadoRef.current = layerId;
        if (initialFilterRef.current) {
            setFiltro(initialFilterRef.current);
            return;
        }
        if (isRaster) {
            setFiltro(latestRasterDate(periodicidad));
            return;
        }
        if (geometria === 'polygon') {
            setFiltro(generateCQLFilter(new Set([`${years[0]}`])));
        }
    }, [hasPeriodicidad, geometria, layerId, years, isRaster, periodicidad]);

    useEffect(() => {
        onFilterChangeRef.current?.(filtro);
    }, [filtro]);

    useEffect(() => {
        const source = wmsLayerRef.current?.getSource();
        if (!source) return;
        const params = source.getParams();
        if (isRaster) {
            if ((params.TIME || null) === (filtro || null)) return;
            source.updateParams({ TIME: filtro || undefined });
        } else {
            if ((params.CQL_FILTER || null) === (filtroMapa || null)) return;
            source.updateParams({ CQL_FILTER: filtroMapa || undefined });
        }
    }, [filtro, filtroMapa, wmsLayerRef, capa, isRaster]);

    return {
        layerId,
        periodicidad,
        loading,
        geometria,
        isRaster,
        hasPeriodicidad,
        filtro,
        filtroMapa,
        applyFilter,
        clearFilter,
        getSpecificFilter,
        getLayerFilters,
        getPeriodicity,
    };
};
