import { useCallback } from 'react';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { findWMSConfig } from '../helpers/wmsConfig';
import { layers } from '../helpers/layers/index';

const IMAGE_LOAD_TIMEOUT = 30000;

export const useWMSLayerFactory = () => {
    const combineCQLFilters = useCallback((baseFilter, dynamicFilter) => {
        if (!baseFilter && !dynamicFilter) return null;
        if (!baseFilter) return dynamicFilter;
        if (!dynamicFilter) return baseFilter;
        return `(${baseFilter}) AND (${dynamicFilter})`;
    }, []);

    const createWMSLayer = useCallback((layerId, visible = true, zIndex = 0, customParams = {}, onLoadStart, onLoadEnd, opacity = 1) => {
        const wmsConfig = findWMSConfig(layerId, layers);
        if (!wmsConfig) return null;

        const wmsParams = {
            'LAYERS': wmsConfig.layerName,
            'FORMAT': wmsConfig.format,
            'TRANSPARENT': wmsConfig.transparent,
            'VERSION': wmsConfig.version,
            'SRS': wmsConfig.srs
        };

        if (wmsConfig.styles && wmsConfig.styles.trim() !== '') {
            wmsParams.STYLES = wmsConfig.styles;
        }

        if (customParams) {
            Object.assign(wmsParams, customParams);
        }

        if (!wmsParams.CQL_FILTER) {
            const baseCqlFilter = wmsConfig.cqlFilter && wmsConfig.cqlFilter.trim() !== '' ? wmsConfig.cqlFilter : null;
            if (baseCqlFilter) {
                wmsParams.CQL_FILTER = baseCqlFilter;
            }
        }

        const imageLoadFunction = (image, src) => {
            const img = image.getImage();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), IMAGE_LOAD_TIMEOUT);

            fetch(src, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    const objectUrl = URL.createObjectURL(blob);
                    img.onload = () => URL.revokeObjectURL(objectUrl);
                    img.src = objectUrl;
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.warn(`Error cargando imagen WMS para ${layerId}:`, error.message);
                });
        };

        const wmsSource = new ImageWMS({
            url: wmsConfig.baseUrl,
            params: wmsParams,
            ratio: 1,
            serverType: 'geoserver',
            crossOrigin: 'anonymous',
            imageLoadFunction
        });

        if (onLoadStart) {
            wmsSource.on('imageloadstart', () => onLoadStart(layerId));
        }

        if (onLoadEnd) {
            wmsSource.on('imageloadend', () => onLoadEnd(layerId));
            wmsSource.on('imageloaderror', () => onLoadEnd(layerId));
        }

        const wmsLayer = new ImageLayer({
            source: wmsSource,
            visible,
            zIndex,
            opacity,
            layerId,
            wmsConfig
        });

        return wmsLayer;
    }, []);

    return { createWMSLayer, combineCQLFilters };
};
