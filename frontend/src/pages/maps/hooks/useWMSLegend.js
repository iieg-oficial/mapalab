import { useCallback, useContext } from 'react';
import { findWMSConfig, hasWMSConfig, resolveTimeStyle } from '../helpers/wmsConfig';
import { useLayers } from '@hooks/useLayers';
import MapsContext from '@contexts/MapsContext';

export const useWMSLegend = () => {
    const { getFilter } = useContext(MapsContext);
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
        dateValue
    } = {}) => {
        const effectiveId = resolveWMSId(layer);
        if (!effectiveId) return null;
        const wmsConfig = findWMSConfig(effectiveId, layers);

        if (wmsConfig) {
            const legendOptions = [
                `fontName:${fontName}`,
                `fontSize:${fontSize}`,
                `fontStyle:${fontStyle}`,
                'fontAntiAliasing:true',
                `fontColor:${fontColor}`,
                `labelMargin:${labelMargin}`,
                `dpi:${dpi}`,
                `forceLabels:${forceLabels}`,
            ].join(';');

            let style = wmsConfig.styles || '';
            if (wmsConfig.timeStylePattern) {
                const timeValue = dateValue !== undefined ? dateValue : getFilter?.(effectiveId);
                if (timeValue) {
                    style = resolveTimeStyle(wmsConfig.timeStylePattern, timeValue);
                }
            }

            const url = `${wmsConfig.baseUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${wmsConfig.layerName}&format=image/png&width=${iconWidth}&height=${iconHeight}${transparent ? '&transparent=true' : ''}&LEGEND_OPTIONS=${legendOptions}${style ? `&STYLE=${style}` : ''}`;
            return url;
        }
        return null;
    }, [getFilter, layers, resolveWMSId]);

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
            console.error('Error fetching legend JSON:', error);
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
