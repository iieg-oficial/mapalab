import { useCallback } from 'react';
import { findWMSConfig, hasWMSConfig } from '../helpers/wmsConfig';
import { layers } from '../helpers/layers/index';

export const useWMSLegend = () => {
    const openLegend = useCallback((layer) => {
        const wmsConfig = findWMSConfig(layer.id, layers);

        if (wmsConfig) {
            const url = `${wmsConfig.baseUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic&transparent=true&layer=${wmsConfig.layerName}&format=image/png`;
            window.open(url, '_blank', 'width=300,height=400');
        }
    }, []);

    const getLegendUrl = useCallback((layer) => {
        const wmsConfig = findWMSConfig(layer.id, layers);

        if (wmsConfig) {
            const url = `${wmsConfig.baseUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic&transparent=true&layer=${wmsConfig.layerName}&format=image/png&width=240&height=40`;
            return url;
        }
        return null;
    }, []);

    const hasLegend = useCallback((layer) => {
        return hasWMSConfig(layer.id, layers);
    }, []);

    const baseUrl = useCallback((layer) => {
        const wmsConfig = findWMSConfig(layer.id, layers);

        if (wmsConfig) {
            return { layer, wmsConfig };
        }

        return null;
    }, []);

    return {
        openLegend,
        getLegendUrl,
        hasLegend,
        baseUrl
    };
};