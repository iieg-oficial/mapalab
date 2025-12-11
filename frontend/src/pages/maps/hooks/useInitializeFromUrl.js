import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { baseLayers } from '../helpers/layers/definitions/base';
import { layers } from '../helpers/layers/index';

export const filtersInitializationComplete = { value: false };

export const useInitializeFromUrl = () => {
    const [searchParams] = useSearchParams();
    const { onToggleLayer, applyFilter } = useMapsContext();
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current || !onToggleLayer || !applyFilter) return;

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

            const flattenLayers = (layersList) => {
                let flat = [];
                layersList.forEach(layer => {
                    flat.push(layer.id);
                    if (layer.children) {
                        flat = flat.concat(flattenLayers(layer.children));
                    }
                });
                return flat;
            };

            const allLayerIds = flattenLayers(layers);

            layerIds.sort((a, b) => {
                return allLayerIds.indexOf(a) - allLayerIds.indexOf(b);
            });

            const timer = setTimeout(() => {
                layerIds.forEach(layerId => {
                    onToggleLayer(layerId, true);
                });

                filterParams.forEach(({ layerId, cqlFilter }) => {
                    applyFilter(layerId, 'date', cqlFilter);
                });

                filtersInitializationComplete.value = true;
            }, 150);

            initialized.current = true;

            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                const excludedLayers = ['limite_inegi', 'limite_municipal_inegi'];
                baseLayers.children.forEach(layer => {
                    if (!excludedLayers.includes(layer.id)) {
                        onToggleLayer(layer.id, true);
                    }
                });

                filterParams.forEach(({ layerId, cqlFilter }) => {
                    applyFilter(layerId, 'date', cqlFilter);
                });

                filtersInitializationComplete.value = true;
            }, 150);

            initialized.current = true;
            return () => clearTimeout(timer);
        }
    }, [searchParams, onToggleLayer, applyFilter]);
};
