import { useEffect, useState } from 'react';
import { useWMSLegend } from './useWMSLegend';
import { useLayers } from '@hooks/useLayers';
import { findLayerById, collectLayersWithWMS } from '../helpers/layers/utils/layerHelpers';

const symbolUrlCache = new Map();

export const clearSymbolUrlCache = () => symbolUrlCache.clear();

export const useLayerSymbolIcon = (layerId, enabled = true) => {
    const { getLegendUrl, getLegendJson } = useWMSLegend();
    const { layers: allLayers } = useLayers();
    const [symbolUrl, setSymbolUrl] = useState(() => symbolUrlCache.get(layerId) || null);

    useEffect(() => {
        if (!enabled || !layerId) {
            setSymbolUrl(null);
            return;
        }

        if (symbolUrlCache.has(layerId)) {
            setSymbolUrl(symbolUrlCache.get(layerId));
            return;
        }

        const layerNode = findLayerById(layerId, allLayers);
        if (!layerNode) {
            setSymbolUrl(null);
            return;
        }

        const legendLayer = {
            id: layerNode.id,
            childIds: collectLayersWithWMS(layerNode).map(node => node.id)
        };

        let cancelled = false;
        getLegendJson(legendLayer).then(json => {
            if (cancelled) return;
            if (!json) {
                setSymbolUrl(null);
                return;
            }

            const rules = json?.Legend?.[0]?.rules || [];
            let url = null;
            if (rules.length > 0) {
                const options = { forceLabels: 'off', transparent: true };
                if (rules.length > 1 && rules[0]?.name) {
                    options.rule = rules[0].name;
                }
                url = getLegendUrl(legendLayer, options);
            }

            symbolUrlCache.set(layerId, url);
            setSymbolUrl(url);
        });
        return () => { cancelled = true; };
    }, [layerId, enabled, allLayers, getLegendJson, getLegendUrl]);

    return symbolUrl;
};
