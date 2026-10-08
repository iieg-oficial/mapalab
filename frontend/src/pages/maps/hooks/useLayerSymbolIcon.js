import { useEffect, useState } from 'react';
import { useWMSLegend } from './useWMSLegend';
import { useLayers } from '@hooks/useLayers';
import { findLayerById, collectLayersWithWMS } from '../helpers/layers/utils/layerHelpers';

const symbolUrlCache = new Map();

const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const pickRuleForNode = (rules, layerNode) => {
    if (!Array.isArray(rules) || rules.length === 0) return null;
    if (rules.length === 1) return rules[0];

    const label = normalize(layerNode?.label);
    const porNombre = rules.find(rule => normalize(rule?.name) === label);
    if (porNombre) return porNombre;

    const cql = normalize(layerNode?.wmsConfig?.cqlFilter);
    if (cql) {
        const porFiltro = rules.find(rule => {
            const filtro = normalize(rule?.filter).replace(/[[\]]/g, '');
            return filtro && (cql.includes(filtro) || filtro.includes(cql));
        });
        if (porFiltro) return porFiltro;
    }

    return rules[0];
};

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
                const rule = pickRuleForNode(rules, layerNode);
                if (rules.length > 1 && rule?.name) {
                    options.rule = rule.name;
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
