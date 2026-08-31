import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useDebounce } from '@hooks/useDebounce';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useColumnasConfig } from '@hooksMaps/useColumnasConfig';
import { useTablaVista } from '@hooksMaps/useTablaVista';
import { useTablaFiltros } from '@hooksMaps/useTablaFiltros';
import { INEGI_LAYER_IDS } from '@hooksMaps/useFeatureInfo';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { canUseVectorService } from '@pages/maps/helpers/serviceMode';
import { RASTER_WORKSPACES } from '@pages/maps/helpers/layerCqlSegment';
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
    const peticionRef = useRef(null);

    const layerDef = useMemo(() => findLayerDef(layerId, allLayers || []), [allLayers, layerId]);
    const wmsConfig = layerDef?.wmsConfig || null;
    const disponible = Boolean(layerDef && canUseVectorService(layerDef) && wmsConfig?.baseUrl);

    const mensaje = useMemo(() => {
        if (disponible) return null;
        if (!layerDef) return 'No se encontró la capa.';
        if (Array.isArray(layerDef.children) && layerDef.children.length > 0) {
            return 'Este es un grupo de capas: abre la tabla desde una de sus capas.';
        }
        if (RASTER_WORKSPACES.has(wmsConfig?.workspace)) {
            return 'Esta capa es una imagen: no tiene tabla de datos.';
        }
        return 'Esta capa no publica sus datos.';
    }, [disponible, layerDef, wmsConfig?.workspace]);

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
        if (!disponible) {
            setColumnas([]);
            return undefined;
        }

        const controlador = new AbortController();
        fetchNonGeometryColumns(wmsConfig, controlador.signal)
            .then(nombres => setColumnas(ordenarColumnas(nombres || [], configuracion)))
            .catch(() => setColumnas([]));

        return () => controlador.abort();
    }, [configuracion, disponible, wmsConfig]);

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
        if (!disponible) return undefined;

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
    }, [consulta, disponible, fijarConteo, layerId, minimizada, wmsConfig]);

    const visibles = useMemo(() => columnas.filter(columna => columna.visible), [columnas]);
    const totalPaginas = Number.isFinite(total) ? Math.max(Math.ceil(total / TAMANO_PAGINA), 1) : 1;

    return {
        layerDef,
        disponible,
        mensaje,
        columnas,
        visibles,
        filas,
        total,
        pagina,
        totalPaginas,
        cargando: cargando || vista.recalculando,
        error,
        filtros,
        vista,
        orden,
        alternarOrden: useCallback(columna => fijarOrden(layerId, columna), [fijarOrden, layerId]),
        irAPagina: setPagina,
    };
};
