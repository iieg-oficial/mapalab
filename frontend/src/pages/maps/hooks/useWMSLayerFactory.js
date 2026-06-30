import { useCallback } from 'react';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { findWMSConfig } from '../helpers/wmsConfig';
import { useLayers } from '@hooks/useLayers';

export const useWMSLayerFactory = () => {
    const { layers } = useLayers();
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

        if (wmsConfig._embedKey) {
            wmsParams.key = wmsConfig._embedKey;
        }

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

        if (wmsConfig.tiled) {
            const tileSource = new TileWMS({
                url: wmsConfig.baseUrl,
                params: { ...wmsParams, TILED: true },
                serverType: 'geoserver',
                crossOrigin: 'anonymous'
            });

            if (onLoadStart) {
                tileSource.on('tileloadstart', () => onLoadStart(layerId));
            }

            if (onLoadEnd) {
                tileSource.on('tileloadend', () => onLoadEnd(layerId));
            }

            tileSource.on('tileloaderror', (event) => {
                if (import.meta.env.DEV) {
                    const src = event?.tile?.getImage?.()?.src || null;
                    console.warn('[WMS tileloaderror]', { layerId, src, baseUrl: wmsConfig.baseUrl, params: { ...wmsParams } });
                }
                onLoadEnd?.(layerId);
            });

            return new TileLayer({
                source: tileSource,
                visible,
                zIndex,
                opacity,
                layerId,
                wmsConfig
            });
        }

        const wmsSource = new ImageWMS({
            url: wmsConfig.baseUrl,
            params: wmsParams,
            ratio: 1.5,
            serverType: 'geoserver',
            crossOrigin: 'anonymous'
        });

        if (onLoadStart) {
            wmsSource.on('imageloadstart', () => onLoadStart(layerId));
        }

        if (onLoadEnd) {
            wmsSource.on('imageloadend', () => onLoadEnd(layerId));
        }

        wmsSource.on('imageloaderror', (event) => {
            if (import.meta.env.DEV) {
                const src = event?.image?.getImage?.()?.src || null;
                console.warn('[WMS imageloaderror]', { layerId, src, baseUrl: wmsConfig.baseUrl, params: { ...wmsParams } });
            }
            onLoadEnd?.(layerId);
        });

        const wmsLayer = new ImageLayer({
            source: wmsSource,
            visible,
            zIndex,
            opacity,
            layerId,
            wmsConfig
        });

        return wmsLayer;
    }, [layers]);

    return { createWMSLayer, combineCQLFilters };
};
