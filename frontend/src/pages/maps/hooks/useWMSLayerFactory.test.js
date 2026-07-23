import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWMSLayerFactory } from './useWMSLayerFactory';

const LAYER = {
    id: 'curvas_de_nivel',
    wmsConfig: {
        baseUrl: '/geoserver/general/wms',
        layerName: 'general:curvas_de_nivel',
        format: 'image/png',
        transparent: true,
        version: '1.1.0',
        srs: 'EPSG:3857',
        tiled: true,
    },
};

vi.mock('@hooks/useLayers', () => ({
    useLayers: () => ({ layers: [LAYER] }),
}));

const buildTiledLayer = (onStart, onEnd) => {
    const { result } = renderHook(() => useWMSLayerFactory());
    const layer = result.current.createWMSLayer(LAYER.id, true, 0, {}, onStart, onEnd);
    return layer.getSource();
};

describe('indicador de carga con tiles', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('no parpadea: un solo start y un solo end para una tanda de tiles', () => {
        const onStart = vi.fn();
        const onEnd = vi.fn();
        const source = buildTiledLayer(onStart, onEnd);

        for (let i = 0; i < 60; i += 1) source.dispatchEvent('tileloadstart');
        for (let i = 0; i < 60; i += 1) source.dispatchEvent('tileloadend');
        vi.runAllTimers();

        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('no cierra la carga entre tandas de tiles', () => {
        const onStart = vi.fn();
        const onEnd = vi.fn();
        const source = buildTiledLayer(onStart, onEnd);

        source.dispatchEvent('tileloadstart');
        source.dispatchEvent('tileloadend');
        vi.advanceTimersByTime(100);
        source.dispatchEvent('tileloadstart');

        expect(onEnd).not.toHaveBeenCalled();

        source.dispatchEvent('tileloadend');
        vi.runAllTimers();

        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('cierra la carga aunque los tiles fallen', () => {
        const onStart = vi.fn();
        const onEnd = vi.fn();
        const source = buildTiledLayer(onStart, onEnd);

        source.dispatchEvent('tileloadstart');
        source.dispatchEvent('tileloadstart');
        source.dispatchEvent('tileloaderror');
        source.dispatchEvent('tileloaderror');
        vi.runAllTimers();

        expect(onEnd).toHaveBeenCalledTimes(1);
    });
});
