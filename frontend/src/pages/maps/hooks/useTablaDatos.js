import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useDebounce } from '@hooks/useDebounce';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useColumnasConfig } from '@hooksMaps/useColumnasConfig';
import { useTablaVista } from '@hooksMaps/useTablaVista';
import { useTablaFiltros } from '@hooksMaps/useTablaFiltros';
import { INEGI_LAYER_IDS } from '@hooksMaps/useFeatureInfo';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { resolverObjetivo } from '@pages/maps/helpers/tablaCapa';
import { buildLayerMunicipioCql } from '@pages/maps/helpers/municipioCqlBuilder';
import { RASTER_WORKSPACES } from '@pages/maps/helpers/layerCqlSegment';
import { combinar, construirBbox, filtroHeredado, filtrosComunes } from '@pages/maps/helpers/tablaCqlBuilder';
import { fetchNonGeometryColumns } from '@services/downloadUrls';
import { countVectorFeatures } from '@services/vectorLayerService';
import { fetchPagina, ordenarColumnas, MAX_PAGINAS } from '@services/tablaAtributosService';
import { fetchGeometryColumns, getWfsUrl } from '@utils/featureInfoUtils';

const RETARDO_CONSULTA = 300;

export const useTablaDatos = (layerId, { minimizada = false } = {}) => {
    const { allLayers, activeLayerIds, getLayerFilters, municipioMode } = useMapsContext();
    const { estadoDe, fijarConteo, fijarOrden } = useTablaAtributos();
    const { orden, ocultas } = estadoDe(layerId);
    const configuracion = useColumnasConfig(layerId);
    const filtros = useTablaFiltros(layerId);
    const vista = useTablaVista(layerId);

    const [columnas, setColumnas] = useState([]);
    const [filas, setFilas] = useState([]);
    const [total, setTotal] = useState(null);
    const [pagina, setPagina] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [campoGeometria, setCampoGeometria] = useState(null);
    const [columnasListas, setColumnasListas] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);
    const peticionRef = useRef(null);
    const masRef = useRef(null);

    const layerDef = useMemo(() => findLayerDef(layerId, allLayers || []), [allLayers, layerId]);
    const objetivo = useMemo(() => resolverObjetivo(layerDef), [layerDef]);
    const wmsConfig = objetivo.wmsConfig;
    const sinColumnas = columnas.length === 0 && columnasListas;
    const disponible = Boolean(wmsConfig) && !sinColumnas;

    const mensaje = useMemo(() => {
        if (objetivo.motivo) return objetivo.motivo;
        if (!sinColumnas) return null;
        return objetivo.esGrupo
            ? 'Las capas de este grupo no comparten una tabla que se pueda consultar.'
            : 'Esta capa no publica columnas de datos: solo tiene geometría.';
    }, [objetivo.esGrupo, objetivo.motivo, sinColumnas]);

    const heredado = useMemo(() => {
        const propios = objetivo.esGrupo
            ? filtrosComunes((objetivo.capas || []).map(hoja => getLayerFilters?.(hoja.id)))
            : getLayerFilters?.(layerId);
        return filtroHeredado(propios, wmsConfig?.timeEnabled);
    }, [getLayerFilters, layerId, objetivo.capas, objetivo.esGrupo, wmsConfig?.timeEnabled]);

    const municipio = useMemo(() => {
        const ctx = municipioMode?.municipioContext;
        if (!ctx?.active || !wmsConfig) return null;
        if (RASTER_WORKSPACES.has(wmsConfig.workspace)) return null;
        const base = objetivo.esGrupo ? (objetivo.capas?.[0] || layerDef) : layerDef;
        return buildLayerMunicipioCql(base?.searchMeta, ctx, base?.id);
    }, [layerDef, municipioMode?.municipioContext, objetivo.capas, objetivo.esGrupo, wmsConfig]);

    const bbox = useMemo(() => {
        if (!campoGeometria || !vista.extent) return null;
        return construirBbox(campoGeometria, vista.extent, vista.srs);
    }, [campoGeometria, vista.extent, vista.srs]);

    const cqlCompleto = useMemo(
        () => combinar([wmsConfig?.cqlFilter, municipio, heredado, filtros.cql, bbox]),
        [bbox, filtros.cql, heredado, municipio, wmsConfig?.cqlFilter],
    );

    const consulta = useDebounce(
        useMemo(() => ({ cql: cqlCompleto, orden }), [cqlCompleto, orden]),
        RETARDO_CONSULTA,
    );

    useEffect(() => {
        if (!wmsConfig) {
            setColumnas([]);
            setColumnasListas(false);
            return undefined;
        }

        const controlador = new AbortController();
        setColumnasListas(false);
        fetchNonGeometryColumns(wmsConfig, controlador.signal)
            .then(nombres => setColumnas(ordenarColumnas(nombres || [], configuracion)))
            .catch(() => setColumnas([]))
            .finally(() => { if (!controlador.signal.aborted) setColumnasListas(true); });

        return () => controlador.abort();
    }, [configuracion, wmsConfig]);

    useEffect(() => {
        if (!disponible) return;
        const typeName = wmsConfig.wfsLayerName || wmsConfig.layerName;
        const esInegi = (activeLayerIds || []).some(id => INEGI_LAYER_IDS.includes(id));

        fetchGeometryColumns(getWfsUrl(wmsConfig.baseUrl), [typeName])
            .then(columnasGeom => {
                const campo = columnasGeom?.[typeName] || 'the_geom';
                setCampoGeometria(esInegi && campo === 'geom_iieg' ? 'geom_inegi' : campo);
            })
            .catch(() => setCampoGeometria(null));
    }, [activeLayerIds, disponible, wmsConfig]);

    const pedirPagina = useCallback(async (pagina, controlador) => fetchPagina(wmsConfig, {
        cql: consulta.cql,
        pagina,
        orden: consulta.orden,
        ordenPorDefecto: columnas.find(columna => columna.visible)?.nombre || null,
        signal: controlador.signal,
    }), [columnas, consulta.cql, consulta.orden, wmsConfig]);

    useEffect(() => {
        if (!disponible || !columnasListas) return undefined;

        const controlador = new AbortController();
        peticionRef.current?.abort();
        peticionRef.current = controlador;
        setCargando(true);
        setError(null);

        const pedir = async () => {
            try {
                const conteo = await countVectorFeatures(wmsConfig, consulta.cql, controlador.signal);
                if (controlador.signal.aborted) return;
                setTotal(conteo);
                fijarConteo(layerId, conteo);

                if (minimizada) return;

                const { features } = await pedirPagina(0, controlador);
                if (controlador.signal.aborted) return;
                setFilas(features);
                setPagina(0);
            } catch (fallo) {
                if (fallo?.name === 'AbortError' || controlador.signal.aborted) return;
                setError(fallo?.message || 'No se pudieron traer los datos');
                setFilas([]);
            } finally {
                if (!controlador.signal.aborted) setCargando(false);
            }
        };

        pedir();
        return () => controlador.abort();
    }, [columnasListas, consulta.cql, disponible, fijarConteo, layerId, minimizada, pedirPagina, wmsConfig]);

    const hayMas = Number.isFinite(total)
        ? filas.length < total && pagina + 1 < MAX_PAGINAS
        : false;

    const cargarMas = useCallback(async () => {
        if (!hayMas || cargandoMas || cargando) return;
        const controlador = new AbortController();
        masRef.current = controlador;
        setCargandoMas(true);
        try {
            const { features } = await pedirPagina(pagina + 1, controlador);
            if (controlador.signal.aborted) return;
            setFilas(previas => [...previas, ...features]);
            setPagina(actual => actual + 1);
        } catch (fallo) {
            if (fallo?.name !== 'AbortError' && !controlador.signal.aborted) {
                setError(fallo?.message || 'No se pudieron traer más registros');
            }
        } finally {
            if (!controlador.signal.aborted) setCargandoMas(false);
        }
    }, [cargando, cargandoMas, hayMas, pagina, pedirPagina]);

    const chipsHeredados = useMemo(() => {
        const ctx = municipioMode?.municipioContext;
        if (!municipio || !ctx?.active) return [];
        const nombres = ctx.nombres || [];
        const cuantos = ctx.claves?.length || nombres.length;
        const alcance = municipioMode?.scopeLabel;
        let etiqueta;
        if (alcance && cuantos > 1) etiqueta = alcance;
        else if (nombres.length === 1) etiqueta = `Municipio: ${nombres[0]}`;
        else etiqueta = alcance || `${cuantos} municipios`;
        return [{ columna: null, etiqueta, fijo: true }];
    }, [municipio, municipioMode?.municipioContext, municipioMode?.scopeLabel]);

    const tarjeta = useMemo(() => {
        if (layerDef?.littleCard) return layerDef.littleCard;
        return (objetivo.capas || []).find(hoja => hoja.littleCard)?.littleCard || null;
    }, [layerDef, objetivo.capas]);

    const visibles = useMemo(
        () => columnas.filter(columna => columna.visible && !ocultas.includes(columna.nombre)),
        [columnas, ocultas],
    );

    return {
        layerDef,
        tarjeta,
        wmsConfig,
        cql: cqlCompleto,
        campoGeometria,
        esGrupo: objetivo.esGrupo,
        hojasDelGrupo: objetivo.hojas || 0,
        disponible,
        mensaje,
        columnas,
        visibles,
        ocultas,
        filas,
        total,
        hayMas,
        cargandoMas,
        cargarMas,
        cargando: (cargando || vista.recalculando || !columnasListas) && Boolean(wmsConfig),
        error,
        filtros,
        chipsHeredados,
        vista,
        orden,
        alternarOrden: useCallback(columna => fijarOrden(layerId, columna), [fijarOrden, layerId]),
    };
};
