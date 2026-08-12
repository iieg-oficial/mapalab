import { useCallback, useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { useLayers } from '@hooks/useLayers';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { useDebounce } from '@hooks/useDebounce';
import { findWMSConfig, findLayerDef } from '../helpers/wmsConfig';
import { buildLayerCqlSegment } from '../helpers/layerCqlSegment';
import { computeLayerZIndex } from '../helpers/layerZIndex';
import { createVectorLayerStyle, resolveVectorColor } from '../helpers/vectorLayerStyles';
import { VECTOR_FEATURE_LIMIT, VECTOR_LAYER_FLAG } from '../helpers/serviceMode';
import { countVectorFeatures, fetchVectorFeatures, VECTOR_PROJECTION } from '@services/vectorLayerService';

const EMPTY_IDS = [];
const EMPTY_SET = new Set();
const EMPTY_ORDER = [];
const EMPTY_MUNICIPIO_CTX = { active: false, claves: [], nombres: [], bbox: null };

export const useVectorServiceLayerManager = ({
    mapRef,
    activeLayerIds = EMPTY_IDS,
    hiddenLayerIds = EMPTY_IDS,
    vectorLayerIds = EMPTY_SET,
    getFilter,
    combineCQLFilters,
    getLayerOpacity,
    layerOpacities,
    pinnedLayerIds = EMPTY_SET,
    initialOrder = EMPTY_ORDER,
    municipioContext = EMPTY_MUNICIPIO_CTX,
    onTooLarge,
    onError
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

    const removeEntry = useCallback((layerId) => {
        const entry = entriesRef.current.get(layerId);
        if (!entry) return;
        entry.controller.abort();
        mapRef.current?.removeLayer(entry.layer);
        entriesRef.current.delete(layerId);
        setLayerLoading(layerId, false);
    }, [mapRef, setLayerLoading]);

    const loadInto = useCallback(async (layerId, wmsConfig, cqlFilter, source, controller) => {
        setLayerLoading(layerId, true);
        try {
            const matched = await countVectorFeatures(wmsConfig, cqlFilter, controller.signal);
            if (controller.signal.aborted) return;

            if (matched !== null && matched > VECTOR_FEATURE_LIMIT) {
                onTooLargeRef.current?.(layerId, { count: matched, limit: VECTOR_FEATURE_LIMIT });
                return;
            }

            const data = await fetchVectorFeatures(wmsConfig, cqlFilter, controller.signal);
            if (controller.signal.aborted || !data?.features) return;

            source.addFeatures(new GeoJSON().readFeatures(data, {
                dataProjection: VECTOR_PROJECTION,
                featureProjection: VECTOR_PROJECTION
            }));
        } catch (error) {
            if (controller.signal.aborted) return;
            onErrorRef.current?.(layerId, error);
        } finally {
            setLayerLoading(layerId, false);
        }
    }, [setLayerLoading]);

    const buildTargets = useCallback(() => {
        const targets = new Map();

        debouncedActiveLayerIds.forEach((id, index) => {
            if (!vectorLayerIds.has(id)) return;
            if (debouncedHiddenLayerIds.includes(id)) return;

            const wmsConfig = findWMSConfig(id, layers);
            if (!wmsConfig) return;

            const segment = buildLayerCqlSegment({
                subLayers: [{ id, wmsConfig }],
                layers,
                getFilter: getFilterRef.current,
                combineCQLFilters: combineCQLFiltersRef.current,
                municipioContext: municipioContextRef.current
            });
            if (segment === '1=0') return;

            targets.set(id, { wmsConfig, index, cqlFilter: segment === 'INCLUDE' ? '' : segment });
        });

        return targets;
    }, [debouncedActiveLayerIds, debouncedHiddenLayerIds, vectorLayerIds, layers]);

    const createEntry = useCallback((layerId, target, zIndex, opacity) => {
        const map = mapRef.current;
        const layerDef = findLayerDef(layerId, layers);
        const source = new VectorSource();
        const layer = new VectorLayer({
            source,
            zIndex,
            opacity,
            style: createVectorLayerStyle(layerDef?.geometryType, resolveVectorColor(layerDef)),
            layerId,
            wmsConfig: target.wmsConfig,
            [VECTOR_LAYER_FLAG]: true
        });

        const zoomRange = layerDef?.zoomRange;
        if (zoomRange?.min != null) layer.setMinZoom(zoomRange.min);
        if (zoomRange?.max != null) layer.setMaxZoom(zoomRange.max);

        const controller = new AbortController();
        map.addLayer(layer);
        entriesRef.current.set(layerId, { layer, cqlFilter: target.cqlFilter, controller });
        loadInto(layerId, target.wmsConfig, target.cqlFilter, source, controller);
    }, [mapRef, layers, loadInto]);

    const syncLayers = useCallback(() => {
        if (!mapRef.current) return;

        const targets = buildTargets();

        Array.from(entriesRef.current.keys()).forEach(id => {
            if (!targets.has(id)) removeEntry(id);
        });

        const total = debouncedActiveLayerIds.length;

        targets.forEach((target, id) => {
            const zIndex = computeLayerZIndex({
                layerId: id,
                index: target.index,
                total,
                pinnedLayerIds: pinnedLayerIdsRef.current,
                initialOrder: initialOrderRef.current
            });
            const opacity = getLayerOpacityRef.current?.(id) ?? 1;
            const existing = entriesRef.current.get(id);

            if (existing && existing.cqlFilter === target.cqlFilter) {
                if (existing.layer.getZIndex() !== zIndex) existing.layer.setZIndex(zIndex);
                if (existing.layer.getOpacity() !== opacity) existing.layer.setOpacity(opacity);
                return;
            }

            if (existing) removeEntry(id);
            createEntry(id, target, zIndex, opacity);
        });
    }, [mapRef, buildTargets, removeEntry, createEntry, debouncedActiveLayerIds]);

    useEffect(syncLayers, [syncLayers]);

    useEffect(() => {
        syncLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pinnedLayerIds, initialOrder, municipioContext, getFilter]);

    useEffect(() => {
        if (!getLayerOpacity) return;
        entriesRef.current.forEach((entry, layerId) => {
            const opacity = getLayerOpacity(layerId);
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
