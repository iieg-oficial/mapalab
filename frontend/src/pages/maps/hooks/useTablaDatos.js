import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { createAttributeTable } from '@ghegar/tamiz';
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
import { crearAcumulador, fuenteWfs, mensajeDeError, sincronizar } from '@pages/maps/helpers/tamizTabla';
import { ordenarColumnas, MAX_PAGINAS, TAMANO_PAGINA } from '@services/tablaAtributosService';

const RETARDO_CONSULTA = 300;
const SIN_FILAS = [];
const sinSuscripcion = () => () => {};
const sinSnapshot = () => null;
const SIN_ACUMULADOR = { subscribe: sinSuscripcion, getSnapshot: () => SIN_FILAS };

export const useTablaDatos = (layerId, { minimizada = false } = {}) => {
    const { allLayers, activeLayerIds, getLayerFilters, municipioMode } = useMapsContext();
    const { estadoDe, fijarConteo, fijarOrden } = useTablaAtributos();
    const { orden, ocultas, filtros: descriptores, expresionPropia } = estadoDe(layerId);
    const configuracion = useColumnasConfig(layerId);
    const filtros = useTablaFiltros(layerId);
    const vista = useTablaVista(layerId);

    const layerDef = useMemo(() => findLayerDef(layerId, allLayers || []), [allLayers, layerId]);
    const objetivo = useMemo(() => resolverObjetivo(layerDef), [layerDef]);
    const wmsConfig = objetivo.wmsConfig;
    const fuente = useMemo(() => fuenteWfs(wmsConfig), [wmsConfig]);
    const tabla = useMemo(
        () => (fuente ? createAttributeTable({ source: fuente, pageSize: TAMANO_PAGINA, stableSort: true }) : null),
        [fuente],
    );
    const acumulador = useMemo(() => (tabla ? crearAcumulador(tabla) : SIN_ACUMULADOR), [tabla]);
    const snapshot = useSyncExternalStore(tabla?.subscribe ?? sinSuscripcion, tabla?.getSnapshot ?? sinSnapshot);
    const filas = useSyncExternalStore(acumulador.subscribe, acumulador.getSnapshot);

    const esquema = snapshot?.schema ?? null;
    const columnasListas = Boolean(esquema) || snapshot?.status === 'error';
    const columnas = useMemo(
        () => ordenarColumnas((esquema?.fields || []).map(campo => campo.name), configuracion),
        [configuracion, esquema],
    );
    const sinColumnas = columnas.length === 0 && columnasListas;
    const disponible = Boolean(tabla) && !sinColumnas;

    const mensaje = useMemo(() => {
        if (objetivo.motivo) return objetivo.motivo;
        if (!sinColumnas) return null;
        return objetivo.esGrupo
            ? 'Las capas de este grupo no comparten una tabla que se pueda consultar.'
            : 'Esta capa no publica columnas de datos: solo tiene geometría.';
    }, [objetivo.esGrupo, objetivo.motivo, sinColumnas]);

    const campoGeometria = useMemo(() => {
        const campo = esquema?.geometryField;
        if (!campo) return null;
        const esInegi = (activeLayerIds || []).some(id => INEGI_LAYER_IDS.includes(id));
        return esInegi && campo === 'geom_iieg' ? 'geom_inegi' : campo;
    }, [activeLayerIds, esquema]);

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

    const base = useMemo(
        () => combinar([wmsConfig?.cqlFilter, municipio, heredado, bbox]),
        [bbox, heredado, municipio, wmsConfig?.cqlFilter],
    );
    const cqlCompleto = useMemo(() => combinar([base, filtros.cql]), [base, filtros.cql]);

    const consulta = useDebounce(
        useMemo(() => ({
            base,
            filtros: descriptores,
            expresion: expresionPropia,
            orden,
            tamano: minimizada ? 1 : TAMANO_PAGINA,
        }), [base, descriptores, expresionPropia, minimizada, orden]),
        RETARDO_CONSULTA,
    );

    useEffect(() => {
        if (tabla) sincronizar(tabla, consulta);
    }, [consulta, tabla]);

    useEffect(() => {
        if (!tabla) return undefined;
        tabla.start();
        return () => tabla.destroy();
    }, [tabla]);

    const total = snapshot?.total ?? null;

    useEffect(() => {
        if (Number.isFinite(total)) fijarConteo(layerId, total);
    }, [fijarConteo, layerId, total]);

    const cargandoPagina = snapshot?.status === 'loading';
    const hayMas = Number.isFinite(total) && !minimizada
        ? filas.length < total && Math.ceil(filas.length / TAMANO_PAGINA) < MAX_PAGINAS
        : false;

    const cargarMas = useCallback(() => {
        if (!hayMas || cargandoPagina || !tabla) return;
        tabla.setPage(Math.ceil(filas.length / TAMANO_PAGINA));
    }, [cargandoPagina, filas.length, hayMas, tabla]);

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

    const primeraPagina = (snapshot?.page ?? 0) === 0;

    return {
        tabla,
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
        cargandoMas: cargandoPagina && !primeraPagina,
        cargarMas,
        cargando: ((cargandoPagina && primeraPagina) || vista.recalculando || !columnasListas) && Boolean(tabla),
        error: mensajeDeError(snapshot?.error),
        filtros,
        chipsHeredados,
        vista,
        orden,
        alternarOrden: useCallback(columna => fijarOrden(layerId, columna), [fijarOrden, layerId]),
    };
};
