import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { resolveRefToId } from '@pages/maps/helpers/wmsConfig';

export const filtersInitializationComplete = { value: false };

export const useInitializeFromUrl = () => {
    const [searchParams] = useSearchParams();
    const { setActiveLayerIds, getAllChildLayerIds, applyFilter, applyDefaultDate, setSelectedLayerForSymbology, findLayerById } = useMapsContext();
    const { initialOrder: BASE_INITIAL_ORDER, layers: layerTree } = useLayers();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current || !setActiveLayerIds || !applyFilter) return;

        const tree = Array.isArray(layerTree) ? layerTree : [];
        const resolveRef = (ref) => resolveRefToId(ref, tree);

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
                const selectedLayer = findLayerById(resolved);
                if (selectedLayer) setSelectedLayerForSymbology(selectedLayer);
                allIds.forEach(id => applyDefaultDate(id));
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

            filtersInitializationComplete.value = true;
            initialized.current = true;
        } else {
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

            filtersInitializationComplete.value = true;
            initialized.current = true;
        }
    }, [searchParams, setActiveLayerIds, getAllChildLayerIds, applyFilter, applyDefaultDate, setSelectedLayerForSymbology, findLayerById, layerTree, BASE_INITIAL_ORDER]);
};
