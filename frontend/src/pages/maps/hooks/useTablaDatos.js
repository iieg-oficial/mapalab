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
import { combinar, construirBbox, filtroHeredado } from '@pages/maps/helpers/tablaCqlBuilder';
import { fetchNonGeometryColumns } from '@services/downloadUrls';
import { countVectorFeatures } from '@services/vectorLayerService';
import { fetchPagina, ordenarColumnas, TAMANO_PAGINA } from '@services/tablaAtributosService';
import { fetchGeometryColumns, getWfsUrl } from '@utils/featureInfoUtils';

const RETARDO_CONSULTA = 300;

export const useTablaDatos = (layerId, { minimizada = false } = {}) => {
    const { allLayers, activeLayerIds, getLayerFilters } = useMapsContext();
    const { estadoDe, fijarConteo, fijarOrden } = useTablaAtributos();
    const { orden } = estadoDe(layerId);
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
    const peticionRef = useRef(null);

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

    const heredado = useMemo(
        () => filtroHeredado(getLayerFilters?.(layerId), wmsConfig?.timeEnabled),
        [getLayerFilters, layerId, wmsConfig?.timeEnabled],
    );

    const bbox = useMemo(() => {
        if (!campoGeometria || !vista.extent) return null;
        return construirBbox(campoGeometria, vista.extent, vista.srs);
    }, [campoGeometria, vista.extent, vista.srs]);

    const cqlCompleto = useMemo(
        () => combinar([wmsConfig?.cqlFilter, heredado, filtros.cql, bbox]),
        [bbox, filtros.cql, heredado, wmsConfig?.cqlFilter],
    );

    const consulta = useDebounce(
        useMemo(() => ({ cql: cqlCompleto, orden, pagina }), [cqlCompleto, orden, pagina]),
        RETARDO_CONSULTA,
    );

    useEffect(() => setPagina(0), [cqlCompleto, orden]);

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
        if (!disponible || vista.vista === 'libre') return;
        const typeName = wmsConfig.wfsLayerName || wmsConfig.layerName;
        const esInegi = (activeLayerIds || []).some(id => INEGI_LAYER_IDS.includes(id));

        fetchGeometryColumns(getWfsUrl(wmsConfig.baseUrl), [typeName])
            .then(columnasGeom => {
                const campo = columnasGeom?.[typeName] || 'the_geom';
                setCampoGeometria(esInegi && campo === 'geom_iieg' ? 'geom_inegi' : campo);
            })
            .catch(() => setCampoGeometria(null));
    }, [activeLayerIds, disponible, vista.vista, wmsConfig]);

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

                const { features } = await fetchPagina(wmsConfig, {
                    cql: consulta.cql,
                    pagina: consulta.pagina,
                    orden: consulta.orden,
                    ordenPorDefecto: columnas.find(columna => columna.visible)?.nombre || null,
                    signal: controlador.signal,
                });
                if (!controlador.signal.aborted) setFilas(features);
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
    }, [columnas, columnasListas, consulta, disponible, fijarConteo, layerId, minimizada, wmsConfig]);

    const visibles = useMemo(() => columnas.filter(columna => columna.visible), [columnas]);
    const totalPaginas = Number.isFinite(total) ? Math.max(Math.ceil(total / TAMANO_PAGINA), 1) : 1;

    return {
        layerDef,
        esGrupo: objetivo.esGrupo,
        hojasDelGrupo: objetivo.hojas || 0,
        disponible,
        mensaje,
        columnas,
        visibles,
        filas,
        total,
        pagina,
        totalPaginas,
        cargando: (cargando || vista.recalculando || !columnasListas) && Boolean(wmsConfig),
        error,
        filtros,
        vista,
        orden,
        alternarOrden: useCallback(columna => fijarOrden(layerId, columna), [fijarOrden, layerId]),
        irAPagina: setPagina,
    };
};
