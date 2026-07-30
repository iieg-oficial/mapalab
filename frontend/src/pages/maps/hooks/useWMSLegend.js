import { useCallback, useContext } from 'react';
import { findWMSConfig, hasWMSConfig } from '../helpers/wmsConfig';
import { buildLegendGraphicUrl } from '../helpers/legendUrl';
import { useLayers } from '@hooks/useLayers';
import MapsContext from '@contexts/MapsContext';

export const useWMSLegend = () => {
    const { getFilter, getSpecificFilter } = useContext(MapsContext);
    const { layers } = useLayers();

    const resolveWMSId = useCallback((layer) => {
        if (!layer) return null;
        if (hasWMSConfig(layer.id, layers)) return layer.id;
        if (Array.isArray(layer.childIds)) {
            return layer.childIds.find(cid => hasWMSConfig(cid, layers)) || null;
        }
        return null;
    }, [layers]);

    const getLegendUrl = useCallback((layer, {
        dpi = 100,
        iconWidth = 20,
        iconHeight = 20,
        transparent = false,
        fontName = 'Garet Regular',
        fontSize = 10,
        fontStyle = 'normal',
        fontColor = '0x454545',
        labelMargin = 12,
        forceLabels = 'on',
        rule,
        dateValue
    } = {}) => {
        const effectiveId = resolveWMSId(layer);
        if (!effectiveId) return null;
        const wmsConfig = findWMSConfig(effectiveId, layers);
        if (!wmsConfig) return null;

        const timeValue = dateValue !== undefined ? dateValue : getFilter?.(effectiveId);
        const cqlFilter = wmsConfig.timeStylePattern ? null : (getSpecificFilter?.(effectiveId, 'date') || null);

        return buildLegendGraphicUrl({
            baseUrl: wmsConfig.baseUrl,
            layerName: wmsConfig.layerName,
            styles: wmsConfig.styles || '',
            timeStylePattern: wmsConfig.timeStylePattern,
            dateValue: timeValue,
            cqlFilter,
            hideEmptyRules: true,
            iconWidth,
            iconHeight,
            transparent,
            rule,
            options: { dpi, fontName, fontSize, fontStyle, fontColor, labelMargin, forceLabels },
        });
    }, [getFilter, getSpecificFilter, layers, resolveWMSId]);

    const getLegendJson = useCallback(async (layer) => {
        const effectiveId = resolveWMSId(layer);
        if (!effectiveId) return null;
        const wmsConfig = findWMSConfig(effectiveId, layers);

        if (!wmsConfig) return null;

        const url = `${wmsConfig.baseUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${wmsConfig.layerName}&format=application/json`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            return data;
        } catch (error) {
            console.debug('[wmsLegend] fallo:', error?.message || error);
            return null;
        }
    }, [layers, resolveWMSId]);

    const hasLegend = useCallback((layer) => {
        return resolveWMSId(layer) !== null;
    }, [resolveWMSId]);

    const baseUrl = useCallback((layer) => {
        const effectiveId = resolveWMSId(layer);
        if (!effectiveId) return null;
        const wmsConfig = findWMSConfig(effectiveId, layers);

        if (wmsConfig) {
            return { layer, wmsConfig };
        }

        return null;
    }, [layers, resolveWMSId]);

    return {
        getLegendUrl,
        getLegendJson,
        hasLegend,
        baseUrl
    };
};
