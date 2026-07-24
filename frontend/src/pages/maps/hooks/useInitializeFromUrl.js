import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { resolveRefToId } from '@pages/maps/helpers/wmsConfig';
import { useShareDeserializer } from '@pages/maps/hooks/useShareDeserializer';
import { fetchShare } from '@services/shareService';
import { trackShareMap } from '@services/analyticsService';
import { SESSION_STORAGE_KEY } from '@pages/maps/hooks/useSessionPersistence';

const MAX_SESSION_BYTES = 200_000;

export const filtersInitializationComplete = { value: false };

export const useInitializeFromUrl = () => {
    const [searchParams] = useSearchParams();
    const { setActiveLayerIds, getAllChildLayerIds, applyFilter, applyDefaultDate, setSelectedLayerForSymbology, restoreSelectedById, findLayerById, municipioMode } = useMapsContext();
    const { initialOrder: BASE_INITIAL_ORDER, layers: layerTree } = useLayers();
    const deserialize = useShareDeserializer();
    const initialized = useRef(false);
    const shareFetchStarted = useRef(false);

    const parseMunicipiosParam = (raw) => {
        if (!raw) return [];
        return raw.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    };

    const enterMunicipioModeIfRequested = () => {
        const param = searchParams.get('municipios');
        const claves = parseMunicipiosParam(param);
        if (claves.length > 0 && municipioMode?.enter) {
            municipioMode.enter(claves, { fromUrl: true });
        }
    };

    useEffect(() => {
        if (initialized.current || !setActiveLayerIds || !applyFilter) return;

        const tree = Array.isArray(layerTree) ? layerTree : [];
        const resolveRef = (ref) => resolveRefToId(ref, tree);

        const shareId = searchParams.get('s');
        if (shareId) {
            if (shareFetchStarted.current) return;
            shareFetchStarted.current = true;
            (async () => {
                try {
                    const envelope = await fetchShare(shareId);
                    if (envelope) {
                        const applied = deserialize(envelope);
                        if (applied) {
                            trackShareMap('opened');
                            initialized.current = true;
                            filtersInitializationComplete.value = true;
                            return;
                        }
                    }
                    trackShareMap('not_found');
                } catch {
                    trackShareMap('error');
                }
                initialized.current = true;
                filtersInitializationComplete.value = true;
            })();
            return;
        }

        const layersParam = searchParams.get('layers');
        const layerSingleParam = searchParams.get('layer');

        const filterParams = [];
        for (const [key, value] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                const refKey = key.replace('filter_', '');
                const resolved = resolveRef(refKey) || refKey;
                filterParams.push({ layerId: resolved, cqlFilter: value });
            }
        }

        if (layerSingleParam) {
            const resolved = resolveRef(layerSingleParam);
            if (resolved) {
                const allIds = [resolved];
                getAllChildLayerIds(resolved).forEach(childId => {
                    if (!allIds.includes(childId)) allIds.push(childId);
                });
                setActiveLayerIds(allIds);
                restoreSelectedById?.(resolved);
                const selectedLayer = findLayerById(resolved);
                if (selectedLayer) setSelectedLayerForSymbology(selectedLayer);
                allIds.forEach(id => applyDefaultDate(id));
                enterMunicipioModeIfRequested();
                filtersInitializationComplete.value = true;
                initialized.current = true;
                return;
            }
        }

        if (layersParam) {
            let selectedId = null;
            const layerIds = layersParam
                .split(',')
                .map(token => token.trim())
                .filter(token => token.length > 0)
                .map(token => {
                    let ref = token;
                    let isSelected = false;
                    if (ref.startsWith('*')) {
                        ref = ref.slice(1);
                        isSelected = true;
                    }
                    const resolved = resolveRef(ref) || ref;
                    if (isSelected) selectedId = resolved;
                    return resolved;
                });

            const allIds = [];
            layerIds.forEach(id => {
                if (!allIds.includes(id)) {
                    allIds.push(id);
                    getAllChildLayerIds(id).forEach(childId => {
                        if (!allIds.includes(childId)) allIds.push(childId);
                    });
                }
            });
            setActiveLayerIds(allIds);

            if (selectedId) {
                restoreSelectedById?.(selectedId);
                const selectedLayer = findLayerById(selectedId);
                if (selectedLayer) setSelectedLayerForSymbology(selectedLayer);
            }

            const filterLayerIds = new Set(filterParams.map(f => f.layerId));
            allIds.forEach(id => {
                if (!filterLayerIds.has(id)) applyDefaultDate(id);
            });

            filterParams.forEach(({ layerId, cqlFilter }) => {
                applyFilter(layerId, 'date', cqlFilter);
            });

            enterMunicipioModeIfRequested();

            filtersInitializationComplete.value = true;
            initialized.current = true;
        } else {
            // Antes del fallback a capas iniciales, intentamos restaurar el estado
            // desde sessionStorage (sobrevive un refresh, se pierde al cerrar pestana)
            try {
                const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
                if (saved && saved.length <= MAX_SESSION_BYTES) {
                    const envelope = JSON.parse(saved);
                    const isValidEnvelope = (
                        envelope !== null && typeof envelope === 'object'
                        && (envelope.version === 1 || envelope.version === 2)
                        && (envelope.kind === 'single' || envelope.kind === 'swipe')
                        && envelope.payload !== null && typeof envelope.payload === 'object'
                    );
                    const hasSingleLayers = isValidEnvelope && Array.isArray(envelope.payload.layers) && envelope.payload.layers.length > 0;
                    const hasSwipeLayers = isValidEnvelope && envelope.kind === 'swipe' && (
                        (Array.isArray(envelope.payload.paneA?.layers) && envelope.payload.paneA.layers.length > 0)
                        || (Array.isArray(envelope.payload.paneB?.layers) && envelope.payload.paneB.layers.length > 0)
                    );
                    if ((hasSingleLayers || hasSwipeLayers) && deserialize(envelope)) {
                        filtersInitializationComplete.value = true;
                        initialized.current = true;
                        return;
                    }
                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                } else if (saved) {
                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                }
            } catch { /* sessionStorage no disponible o JSON invalido — fallback */ }

            const allIds = [];

            BASE_INITIAL_ORDER.forEach(id => {
                if (!allIds.includes(id)) {
                    allIds.push(id);
                    getAllChildLayerIds(id).forEach(childId => {
                        if (!allIds.includes(childId)) allIds.push(childId);
                    });
                }
            });

            setActiveLayerIds(allIds);

            const filterLayerIdsBase = new Set(filterParams.map(f => f.layerId));
            allIds.forEach(id => {
                if (!filterLayerIdsBase.has(id)) applyDefaultDate(id);
            });

            filterParams.forEach(({ layerId, cqlFilter }) => {
                applyFilter(layerId, 'date', cqlFilter);
            });

            enterMunicipioModeIfRequested();

            filtersInitializationComplete.value = true;
            initialized.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, setActiveLayerIds, getAllChildLayerIds, applyFilter, applyDefaultDate, setSelectedLayerForSymbology, restoreSelectedById, findLayerById, layerTree, BASE_INITIAL_ORDER, deserialize, municipioMode]);
};
