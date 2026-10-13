import { useCallback, useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { useLayers } from '@hooks/useLayers';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { joinCQLFilters } from '@utils/featureInfoUtils';
import { useDebounce } from '@hooks/useDebounce';
import { findWMSConfig, findLayerDef } from '../helpers/wmsConfig';
import { buildLayerCqlSegment, buildMunicipioCqlDeGrupo } from '../helpers/layerCqlSegment';
import { CQL_SIN_RESOLVER } from '../helpers/municipioCqlBuilder';
import { computeLayerZIndex } from '../helpers/layerZIndex';
import { createVectorLayerStyle, resolveVectorColor } from '../helpers/vectorLayerStyles';
import { actualizarEntradaHexbin, montarHexbin, vistaPara } from '../helpers/hexbinEntrada';
import { OPCIONES_HEXBIN_BASE } from '../helpers/hexbinOpciones';
import { VECTOR_FEATURE_LIMIT, VECTOR_LAYER_FLAG, SERVICE_HEXBIN } from '../helpers/serviceMode';
import { countVectorFeatures, fetchVectorFeatures, VECTOR_PROJECTION } from '@services/vectorLayerService';

const EMPTY_IDS = [];
const EMPTY_SET = new Set();
const EMPTY_MODES = new Map();
const EMPTY_ORDER = [];
const EMPTY_MUNICIPIO_CTX = { active: false, claves: [], nombres: [], bbox: null };

export const useVectorServiceLayerManager = ({
    mapRef,
    activeLayerIds = EMPTY_IDS,
    hiddenLayerIds = EMPTY_IDS,
    vectorModes = EMPTY_MODES,
    getFilter,
    combineCQLFilters,
    getLayerOpacity,
    layerOpacities,
    pinnedLayerIds = EMPTY_SET,
    initialOrder = EMPTY_ORDER,
    municipioContext = EMPTY_MUNICIPIO_CTX,
    onTooLarge,
    onError,
    onHexbinStats,
    sinFondo = null,
    getPaletteIndex = null,
    getHexbinOpciones = null
}) => {
    const { layers } = useLayers();
    const { setLayerLoading } = useLayerLoading();
    const entriesRef = useRef(new Map());
    const debouncedActiveLayerIds = useDebounce(activeLayerIds, 30);
    const debouncedHiddenLayerIds = useDebounce(hiddenLayerIds, 30);

    const getFilterRef = useRef(getFilter);
    getFilterRef.current = getFilter;
    const combineCQLFiltersRef = useRef(combineCQLFilters);
    combineCQLFiltersRef.current = combineCQLFilters;
    const getLayerOpacityRef = useRef(getLayerOpacity);
    getLayerOpacityRef.current = getLayerOpacity;
    const pinnedLayerIdsRef = useRef(pinnedLayerIds);
    pinnedLayerIdsRef.current = pinnedLayerIds;
    const initialOrderRef = useRef(initialOrder);
    initialOrderRef.current = initialOrder;
    const municipioContextRef = useRef(municipioContext);
    municipioContextRef.current = municipioContext;
    const onTooLargeRef = useRef(onTooLarge);
    onTooLargeRef.current = onTooLarge;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const onHexbinStatsRef = useRef(onHexbinStats);
    onHexbinStatsRef.current = onHexbinStats;

    const setGroupLoading = useCallback((memberIds, isLoading) => {
        memberIds.forEach(id => setLayerLoading(id, isLoading));
    }, [setLayerLoading]);

    const removeEntry = useCallback((groupKey) => {
        const entry = entriesRef.current.get(groupKey);
        if (!entry) return;
        entry.controller.abort();
        if (entry.montaje) entry.montaje.desmontar();
        else mapRef.current?.removeLayer(entry.layer);
        entriesRef.current.delete(groupKey);
        setGroupLoading(entry.memberIds, false);
    }, [mapRef, setGroupLoading]);

    const montarEntradaHexbinRef = useRef(null);

    const loadInto = useCallback(async (groupKey, target, controller) => {
        const { wmsConfig, cqlFilter, memberIds } = target;
        setGroupLoading(memberIds, true);

        try {
            const matched = await countVectorFeatures(wmsConfig, cqlFilter, controller.signal);
            if (controller.signal.aborted) return;

            if (matched !== null && matched > VECTOR_FEATURE_LIMIT) {
                const vista = target.hexbin ? await vistaPara(wmsConfig, cqlFilter, controller.signal) : null;
                if (controller.signal.aborted) return;
                if (vista) {
                    montarEntradaHexbinRef.current?.(groupKey, target, null, null, false, vista);
                    return;
                }
                memberIds.forEach(id => {
                    onTooLargeRef.current?.(id, { count: matched, limit: VECTOR_FEATURE_LIMIT });
                });
                return;
            }

            const data = await fetchVectorFeatures(wmsConfig, cqlFilter, controller.signal);
            if (controller.signal.aborted || !data?.features) return;

            const features = new GeoJSON().readFeatures(data, {
                dataProjection: VECTOR_PROJECTION,
                featureProjection: VECTOR_PROJECTION
            });

            const entry = entriesRef.current.get(groupKey);
            if (!entry) return;

            (entry.montaje?.vectorSource ?? entry.layer.getSource()).addFeatures(features);
            if (features.length === 0) entry.montaje?.avisarEstadisticas();
        } catch (error) {
            if (controller.signal.aborted) return;
            memberIds.forEach(id => onErrorRef.current?.(id, error));
        } finally {
            setGroupLoading(memberIds, false);
        }
    }, [setGroupLoading]);

    const buildTargets = useCallback(() => {
        const groups = new Map();

        debouncedActiveLayerIds.forEach((id, index) => {
            if (!vectorModes.has(id)) return;
            if (debouncedHiddenLayerIds.includes(id)) return;

            const wmsConfig = findWMSConfig(id, layers);
            if (!wmsConfig) return;

            const segment = buildLayerCqlSegment({
                subLayers: [{ id, wmsConfig }],
                layers,
                getFilter: getFilterRef.current,
                combineCQLFilters: combineCQLFiltersRef.current,
                municipioContext: municipioContextRef.current,
                omitirMunicipio: true
            });
            if (segment === '1=0') return;

            const muniCql = buildMunicipioCqlDeGrupo({
                subLayers: [{ id, wmsConfig }],
                layers,
                municipioContext: municipioContextRef.current
            });
            if (muniCql === CQL_SIN_RESOLVER) return;

            const sinFiltroUsuario = !getFilterRef.current?.(id) && !municipioContextRef.current?.active;
            const typeName = wmsConfig.wfsLayerName || wmsConfig.layerName;
            const groupKey = `${wmsConfig.baseUrl}|${typeName}|${vectorModes.get(id)}`;
            const existing = groups.get(groupKey);

            if (!existing) {
                groups.set(groupKey, {
                    wmsConfig,
                    index,
                    segments: [segment],
                    muniCql,
                    memberIds: [id],
                    hexbin: vectorModes.get(id) === SERVICE_HEXBIN,
                    precalculable: sinFiltroUsuario
                });
                return;
            }

            existing.segments.push(segment);
            existing.memberIds.push(id);
            existing.precalculable = existing.precalculable && sinFiltroUsuario;
            if (index < existing.index) existing.index = index;
        });

        groups.forEach((group) => {
            const unique = [...new Set(group.segments)];
            const unido = unique.includes('INCLUDE')
                ? ''
                : joinCQLFilters(unique);

            if (!group.muniCql) {
                group.cqlFilter = unido;
                return;
            }
            group.cqlFilter = unido ? `(${group.muniCql}) AND (${unido})` : group.muniCql;
        });

        return groups;
    }, [debouncedActiveLayerIds, debouncedHiddenLayerIds, vectorModes, layers]);

    const montarEntradaHexbin = useCallback((groupKey, target, zIndex, opacity, precalculado, vista = null) => {
        const entry = entriesRef.current.get(groupKey);
        if (!entry) return;
        const previo = entry.montaje;
        const montaje = montarHexbin({
            map: mapRef.current,
            precalculado,
            vista,
            opciones: target.opciones,
            memberIds: target.memberIds,
            zIndex: previo?.layer.getZIndex() ?? zIndex,
            opacity: previo?.layer.getOpacity() ?? opacity,
            paletteIndex: previo?.layer.get('paletteIndex') ?? target.paletteIndex ?? 0,
            rellenoActivo: previo?.layer.get('rellenoActivo') !== false,
            zoomRange: findLayerDef(target.memberIds[0], layers)?.zoomRange,
            onStats: stats => onHexbinStatsRef.current?.(target.memberIds, stats),
            onLoading: cargando => setGroupLoading(target.memberIds, cargando),
            onAcercate: aviso => onHexbinStatsRef.current?.(target.memberIds, { legend: [], max: 0, cells: 0, acercate: aviso }),
            onSinPrecalculado: () => {
                if (entriesRef.current.get(groupKey) !== entry || entry.montaje !== montaje) return;
                montarEntradaHexbin(groupKey, target, zIndex, opacity, false);
                loadInto(groupKey, target, entry.controller);
            }
        });
        previo?.desmontar();
        entry.montaje = montaje;
        entry.layer = montaje.layer;
    }, [mapRef, layers, setGroupLoading, loadInto]);
    montarEntradaHexbinRef.current = montarEntradaHexbin;

    const createEntry = useCallback((groupKey, target, zIndex, opacity) => {
        const map = mapRef.current;
        const layerId = target.memberIds[0];
        const layerDef = findLayerDef(layerId, layers);
        const controller = new AbortController();
        const base = { cqlFilter: target.cqlFilter, hexbin: target.hexbin, memberIds: target.memberIds, controller, opciones: target.opciones };

        if (target.hexbin) {
            entriesRef.current.set(groupKey, { ...base, layer: null, montaje: null });
            montarEntradaHexbin(groupKey, target, zIndex, opacity, !!target.precalculable);
            if (!target.precalculable) loadInto(groupKey, target, controller);
            return;
        }

        const layer = new VectorLayer({
            source: new VectorSource(),
            zIndex,
            opacity,
            style: createVectorLayerStyle(layerDef?.geometryType, resolveVectorColor(layerDef)),
            layerId,
            wmsConfig: target.wmsConfig,
            [VECTOR_LAYER_FLAG]: true
        });

        layer.set('memberIds', target.memberIds);

        const zoomRange = layerDef?.zoomRange;
        if (zoomRange?.min != null) layer.setMinZoom(zoomRange.min);
        if (zoomRange?.max != null) layer.setMaxZoom(zoomRange.max);

        map.addLayer(layer);
        entriesRef.current.set(groupKey, { ...base, layer });
        loadInto(groupKey, target, controller);
    }, [mapRef, layers, loadInto, montarEntradaHexbin]);

    const syncLayers = useCallback(() => {
        if (!mapRef.current) return;

        const targets = buildTargets();

        Array.from(entriesRef.current.keys()).forEach(groupKey => {
            if (!targets.has(groupKey)) removeEntry(groupKey);
        });

        const total = debouncedActiveLayerIds.length;

        targets.forEach((target, groupKey) => {
            if (target.hexbin) {
                target.paletteIndex = getPaletteIndex?.(target.memberIds[0]) ?? 0;
                target.opciones = getHexbinOpciones?.(target.memberIds[0]) ?? OPCIONES_HEXBIN_BASE;
                target.precalculable = target.precalculable && !target.opciones.campo;
            }

            const representativeId = target.memberIds[0];
            const zIndex = computeLayerZIndex({
                layerId: representativeId,
                index: target.index,
                total,
                pinnedLayerIds: pinnedLayerIdsRef.current,
                initialOrder: initialOrderRef.current
            });
            const opacity = getLayerOpacityRef.current?.(representativeId) ?? 1;
            const existing = entriesRef.current.get(groupKey);

            const mismoCampo = !target.hexbin || existing?.opciones?.campo === target.opciones.campo;
            if (existing && existing.cqlFilter === target.cqlFilter && existing.hexbin === target.hexbin && mismoCampo) {
                if (existing.layer.getZIndex() !== zIndex) existing.layer.setZIndex(zIndex);
                if (existing.layer.getOpacity() !== opacity) existing.layer.setOpacity(opacity);
                if (target.hexbin) actualizarEntradaHexbin(existing, target);
                return;
            }

            if (existing) removeEntry(groupKey);
            createEntry(groupKey, target, zIndex, opacity);
        });
    }, [mapRef, buildTargets, removeEntry, createEntry, debouncedActiveLayerIds, getPaletteIndex, getHexbinOpciones]);

    useEffect(syncLayers, [syncLayers]);

    useEffect(() => {
        syncLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pinnedLayerIds, initialOrder, municipioContext, getFilter]);

    useEffect(() => {
        entriesRef.current.forEach((entry) => {
            if (!entry.hexbin) return;
            const conRelleno = !sinFondo?.size || !entry.memberIds.some(id => sinFondo.has(id));
            if (entry.layer.get('rellenoActivo') === conRelleno) return;
            entry.layer.set('rellenoActivo', conRelleno);
            entry.layer.changed();
        });
    }, [sinFondo]);

    useEffect(() => {
        if (!getLayerOpacity) return;
        entriesRef.current.forEach((entry) => {
            const opacity = getLayerOpacity(entry.memberIds[0]) ?? 1;
            if (entry.layer.getOpacity() !== opacity) entry.layer.setOpacity(opacity);
        });
    }, [layerOpacities, getLayerOpacity]);

    useEffect(() => {
        const entries = entriesRef.current;
        const map = mapRef.current;
        return () => {
            entries.forEach(entry => {
                entry.controller.abort();
                if (entry.montaje) entry.montaje.desmontar();
                else map?.removeLayer(entry.layer);
            });
            entries.clear();
        };
    }, [mapRef]);

    return { vectorEntriesRef: entriesRef };
};
