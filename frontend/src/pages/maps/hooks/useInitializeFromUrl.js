import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';

export const filtersInitializationComplete = { value: false };

export const useInitializeFromUrl = () => {
    const [searchParams] = useSearchParams();
    const { setActiveLayerIds, getAllChildLayerIds, applyFilter, applyDefaultDate, setSelectedLayerForSymbology, findLayerById } = useMapsContext();
    const { initialOrder: BASE_INITIAL_ORDER } = useLayers();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current || !setActiveLayerIds || !applyFilter) return;

        const layersParam = searchParams.get('layers');
        const filterParams = [];

        for (const [key, value] of searchParams.entries()) {
            if (key.startsWith('filter_')) {
                const layerId = key.replace('filter_', '');
                filterParams.push({ layerId, cqlFilter: value });
            }
        }

        if (layersParam) {
            let selectedId = null;
            const layerIds = layersParam
                .split(',')
                .map(id => id.trim())
                .filter(id => id.length > 0)
                .map(id => {
                    if (id.startsWith('*')) {
                        const cleanId = id.slice(1);
                        selectedId = cleanId;
                        return cleanId;
                    }
                    return id;
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
    }, [searchParams, setActiveLayerIds, getAllChildLayerIds, applyFilter, applyDefaultDate, setSelectedLayerForSymbology, findLayerById]);
};
