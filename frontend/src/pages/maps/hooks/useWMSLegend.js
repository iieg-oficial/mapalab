import { useCallback } from 'react';
import { findWMSConfig, hasWMSConfig } from '../helpers/wmsConfig';
import { layers } from '../helpers/layers/index';

export const useWMSLegend = () => {
    const getLegendUrl = useCallback((layer) => {
        const wmsConfig = findWMSConfig(layer.id, layers);

        if (wmsConfig) {
            const legendOptions = [
                'fontName:Helvetica',
                'fontSize:10',
                'fontStyle:normal',
                'fontAntiAliasing:true',
                'fontColor:0x454545',
                'labelMargin:12',
                'dpi:100',
            ].join(';');

            const url = `${wmsConfig.baseUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${wmsConfig.layerName}&format=image/png&width=20&height=20&LEGEND_OPTIONS=${legendOptions}`;
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
        getLegendUrl,
        hasLegend,
        baseUrl
    };
};