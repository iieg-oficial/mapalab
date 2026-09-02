import { useCallback, useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { useLayers } from '@hooks/useLayers';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { joinCQLFilters } from '@/utils/featureInfoUtils';
import { useDebounce } from '@hooks/useDebounce';
import { findWMSConfig, findLayerDef } from '../helpers/wmsConfig';
import { buildLayerCqlSegment, buildMunicipioCqlDeGrupo } from '../helpers/layerCqlSegment';
import { CQL_SIN_RESOLVER } from '../helpers/municipioCqlBuilder';
import { computeLayerZIndex } from '../helpers/layerZIndex';
import { createVectorLayerStyle, resolveVectorColor } from '../helpers/vectorLayerStyles';
import { createHexbinLayer, fillHexbinLayer, fillHexbinLayerFromCells } from '../helpers/hexbinLayer';
import { useHexbinZoomRefresh } from './useHexbinZoomRefresh';
import { fetchAggregatedCells, nearestPrecomputed } from '@services/hexbinAggregateService';
import { resolutionForZoom } from '@constants/hexbin';
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
    getPaletteIndex = null
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
        mapRef.current?.removeLayer(entry.layer);
        entriesRef.current.delete(groupKey);
        setGroupLoading(entry.memberIds, false);
    }, [mapRef, setGroupLoading]);

    const currentZoom = useCallback(() => mapRef.current?.getView?.()?.getZoom?.(), [mapRef]);

    const _usarPrecalculado = useCallback(async (groupKey, memberIds, zoom, controller) => {
        const resolucion = nearestPrecomputed(resolutionForZoom(zoom));
        if (!resolucion) return null;

        const celdas = await fetchAggregatedCells(memberIds, resolucion, controller.signal);
        if (!celdas?.length || controller.signal.aborted) return null;

        const entry = entriesRef.current.get(groupKey);
        if (!entry) return null;

        entry.precalculado = true;
        entry.resolucion = resolucion;
        return fillHexbinLayerFromCells(entry.layer, celdas);
    }, []);

    const loadInto = useCallback(async (groupKey, target, controller) => {
        const { wmsConfig, cqlFilter, memberIds, hexbin, precalculable } = target;
        setGroupLoading(memberIds, true);

        try {
            if (hexbin && precalculable) {
                const stats = await _usarPrecalculado(groupKey, memberIds, currentZoom(), controller);
                if (stats) {
                    onHexbinStatsRef.current?.(memberIds, stats);
                    return;
                }
            }

            const matched = await countVectorFeatures(wmsConfig, cqlFilter, controller.signal);
            if (controller.signal.aborted) return;

            if (matched !== null && matched > VECTOR_FEATURE_LIMIT) {
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
            entry.features = features;

            if (hexbin) {
                entry.resolucion = resolutionForZoom(currentZoom());
                const stats = fillHexbinLayer(entry.layer, features, entry.resolucion);
                onHexbinStatsRef.current?.(memberIds, stats);
                return;
            }

            entry.layer.getSource().addFeatures(features);
        } catch (error) {
            if (controller.signal.aborted) return;
            memberIds.forEach(id => onErrorRef.current?.(id, error));
        } finally {
            setGroupLoading(memberIds, false);
        }
    }, [setGroupLoading, currentZoom, _usarPrecalculado]);

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

    const createEntry = useCallback((groupKey, target, zIndex, opacity) => {
        const map = mapRef.current;
        const layerId = target.memberIds[0];
        const layerDef = findLayerDef(layerId, layers);

        const layer = target.hexbin
            ? createHexbinLayer({ layerId, zIndex, opacity, paletteIndex: target.paletteIndex || 0 })
            : new VectorLayer({
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

        const controller = new AbortController();
        map.addLayer(layer);
        entriesRef.current.set(groupKey, {
            layer,
            cqlFilter: target.cqlFilter,
            hexbin: target.hexbin,
            memberIds: target.memberIds,
            controller
        });
        loadInto(groupKey, target, controller);
    }, [mapRef, layers, loadInto]);

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

            if (existing && existing.cqlFilter === target.cqlFilter && existing.hexbin === target.hexbin) {
                if (existing.layer.getZIndex() !== zIndex) existing.layer.setZIndex(zIndex);
                if (existing.layer.getOpacity() !== opacity) existing.layer.setOpacity(opacity);
                if (target.hexbin && existing.layer.get('paletteIndex') !== target.paletteIndex) {
                    existing.layer.set('paletteIndex', target.paletteIndex);
                    existing.layer.changed();
                }
                return;
            }

            if (existing) removeEntry(groupKey);
            createEntry(groupKey, target, zIndex, opacity);
        });
    }, [mapRef, buildTargets, removeEntry, createEntry, debouncedActiveLayerIds, getPaletteIndex]);

    useEffect(syncLayers, [syncLayers]);

    useEffect(() => {
        syncLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pinnedLayerIds, initialOrder, municipioContext, getFilter]);

    useHexbinZoomRefresh({ mapRef, entriesRef, usarPrecalculado: _usarPrecalculado, onStats: onHexbinStatsRef });

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
                map?.removeLayer(entry.layer);
            });
            entries.clear();
        };
    }, [mapRef]);

    return { vectorEntriesRef: entriesRef };
};
