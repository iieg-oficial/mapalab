import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';
import { fetchGeometryType } from '@utils/featureInfoUtils';
import { getLayerTimePeriodicity } from '@services/wmsCapabilitiesService';
import { RASTER_WORKSPACES } from '@services/downloadUrls';
import { fetchCapaPeriodicidad } from '@services/catalogoService';

const FILTER_NAME = 'date';

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

    const applyFilter = useCallback((_layerId, _filterName, cqlFilter) => {
        setFiltro(cqlFilter || null);
    }, []);

    const clearFilter = useCallback(() => setFiltro(null), []);

    const getSpecificFilter = useCallback(
        (_layerId, filterName) => (filterName === FILTER_NAME ? filtro : null),
        [filtro],
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
            if ((params.CQL_FILTER || null) === (filtro || null)) return;
            source.updateParams({ CQL_FILTER: filtro || undefined });
        }
    }, [filtro, wmsLayerRef, capa, isRaster]);

    return {
        layerId,
        periodicidad,
        loading,
        geometria,
        isRaster,
        hasPeriodicidad,
        filtro,
        applyFilter,
        clearFilter,
        getSpecificFilter,
        getPeriodicity,
    };
};
