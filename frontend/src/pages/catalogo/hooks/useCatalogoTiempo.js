import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';
import { fetchGeometryType } from '@utils/featureInfoUtils';
import { getLayerTimePeriodicity } from '@services/wmsCapabilitiesService';
import { RASTER_WORKSPACES } from '@services/downloadUrls';
import { fetchCapaPeriodicidad } from '@services/catalogoService';
import { LLAVE_SELECCION, LLAVE_TABLA, combinar } from '@pages/maps/helpers/tablaCqlBuilder';
import { fechaParamToFiltro, filtroToFechaParam } from '../helpers/catalogoRoutes';

const FILTER_NAME = 'date';
const FILTRO_MUNICIPIO = 'municipio';
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

const esOtraCapa = (id, vigente) => id != null && id !== vigente;

export const useCatalogoTiempo = (capa, wmsLayerRef, { initialFecha = null, onFechaChange, filtroMunicipio = null } = {}) => {
    const [periodicidad, setPeriodicidad] = useState(null);
    const [loading, setLoading] = useState(false);
    const [geometria, setGeometria] = useState(null);
    const [filtro, setFiltro] = useState(null);
    const [filtrosTabla, setFiltrosTabla] = useState({});
    const [capaVigente, setCapaVigente] = useState(null);
    const [capaLista, setCapaLista] = useState(null);
    const primeraCapaRef = useRef(null);
    const initialFechaRef = useRef(initialFecha);
    initialFechaRef.current = initialFecha;
    const onFechaChangeRef = useRef(onFechaChange);
    onFechaChangeRef.current = onFechaChange;

    const layerId = capa?.slug || null;
    const layerIdRef = useRef(layerId);
    layerIdRef.current = layerId;
    const isRaster = !!capa && RASTER_WORKSPACES.has(capa.geoserverWorkspace);

    useEffect(() => {
        setPeriodicidad(null);
        setGeometria(null);
        setFiltro(null);
        setFiltrosTabla({});
        setCapaLista(null);
        setCapaVigente(capa?.slug || null);
        setLoading(false);
        if (!capa) return undefined;
        if (primeraCapaRef.current === null) primeraCapaRef.current = capa.slug;

        const ctrl = new AbortController();
        let cancelled = false;
        const vigente = (fn) => (valor) => {
            if (!cancelled) fn(valor);
        };
        const terminar = () => {
            if (!cancelled) setLoading(false);
        };
        setLoading(true);

        if (RASTER_WORKSPACES.has(capa.geoserverWorkspace)) {
            setGeometria('raster');
            const cfg = hydrateWmsConfig({
                geoserverWorkspace: capa.geoserverWorkspace,
                geoserverLayer: capa.geoserverLayer,
            });
            getLayerTimePeriodicity(cfg)
                .then(vigente(setPeriodicidad))
                .catch(() => vigente(setPeriodicidad)(null))
                .finally(terminar);
            return () => {
                cancelled = true;
                ctrl.abort();
            };
        }

        fetchCapaPeriodicidad(capa, ctrl.signal)
            .then((data) => vigente(setPeriodicidad)(data?.fecha || data || null))
            .catch(() => vigente(setPeriodicidad)(null))
            .finally(terminar);

        const cfg = hydrateWmsConfig({
            geoserverWorkspace: capa.geoserverWorkspace,
            geoserverLayer: capa.geoserverLayer,
        });
        if (cfg) {
            fetchGeometryType(cfg.baseUrl, cfg.layerName)
                .then(vigente(setGeometria))
                .catch(() => vigente(setGeometria)('unknown'));
        }

        return () => {
            cancelled = true;
            ctrl.abort();
        };
    }, [capa]);

    const years = useMemo(() => getYears(periodicidad), [periodicidad]);
    const hasPeriodicidad = years.length > 0;

    const applyFilter = useCallback((id, filterName, cqlFilter) => {
        if (esOtraCapa(id, layerIdRef.current)) return;
        if (FILTROS_TABLA.has(filterName)) {
            setFiltrosTabla((previos) => ({ ...previos, [filterName]: cqlFilter || null }));
            return;
        }
        setFiltro(cqlFilter || null);
    }, []);

    const clearFilter = useCallback((id, filterName) => {
        if (esOtraCapa(id, layerIdRef.current)) return;
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
        Object.entries({
            [FILTER_NAME]: isRaster ? null : filtro,
            [FILTRO_MUNICIPIO]: isRaster ? null : filtroMunicipio,
            ...filtrosTabla,
        }).filter(([, cql]) => cql),
    ), [filtro, filtroMunicipio, filtrosTabla, isRaster]);

    const filtroMapa = useMemo(
        () => (isRaster ? null : combinar([filtro, filtroMunicipio, ...Object.values(filtrosTabla)])),
        [filtro, filtroMunicipio, filtrosTabla, isRaster],
    );

    const getPeriodicity = useCallback(() => periodicidad, [periodicidad]);

    useEffect(() => {
        if (!layerId || capaVigente !== layerId || capaLista === layerId) return;
        if (!hasPeriodicidad || !geometria) return;
        setCapaLista(layerId);
        const fechaInicial = layerId === primeraCapaRef.current ? initialFechaRef.current : null;
        const inicial = fechaParamToFiltro(fechaInicial, { isRaster, periodicidad });
        if (inicial) {
            setFiltro(inicial);
            return;
        }
        if (isRaster) {
            setFiltro(latestRasterDate(periodicidad));
            return;
        }
        if (geometria === 'polygon') {
            setFiltro(generateCQLFilter(new Set([`${years[0]}`])));
        }
    }, [hasPeriodicidad, geometria, layerId, capaVigente, capaLista, years, isRaster, periodicidad]);

    useEffect(() => {
        if (!layerId || capaLista !== layerId) return;
        onFechaChangeRef.current?.(filtroToFechaParam(filtro, { isRaster, periodicidad }));
    }, [filtro, capaLista, layerId, isRaster, periodicidad]);

    useEffect(() => {
        if (capaVigente !== layerId) return;
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
    }, [filtro, filtroMapa, wmsLayerRef, capa, capaVigente, layerId, isRaster]);

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
