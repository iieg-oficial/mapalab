import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { BASE_INITIAL_ORDER } from '../helpers/layers/definitions/base';

export const filtersInitializationComplete = { value: false };

export const useInitializeFromUrl = () => {
    const [searchParams] = useSearchParams();
    const { setActiveLayerIds, getAllChildLayerIds, applyFilter } = useMapsContext();
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
            const layerIds = layersParam
                .split(',')
                .map(id => id.trim())
                .filter(id => id.length > 0);

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

            filterParams.forEach(({ layerId, cqlFilter }) => {
                applyFilter(layerId, 'date', cqlFilter);
            });

            filtersInitializationComplete.value = true;
            initialized.current = true;
        }
    }, [searchParams, setActiveLayerIds, getAllChildLayerIds, applyFilter]);
};
