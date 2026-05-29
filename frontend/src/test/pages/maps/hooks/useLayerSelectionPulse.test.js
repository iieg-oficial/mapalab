import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayerSelection } from '@pages/maps/hooks/useLayerSelectionPulse';
import * as capabilitiesService from '@services/wmsCapabilitiesService';

const buildMockMap = (extent = [0, 0, 100, 100]) => {
    const view = { fit: vi.fn(), calculateExtent: () => extent };
    return {
        getSize: () => [800, 600],
        getView: () => view,
        addLayer: vi.fn(),
        removeLayer: vi.fn(),
    };
};

const buildLayers = (id = 'cap-1') => ([
    {
        id,
        label: 'Capa 1',
        wmsConfig: {
            workspace: 'ws',
            geoserverLayer: 'lyr',
            baseUrl: 'http://gs/ws/wms',
            layerName: 'ws:lyr',
        },
    },
]);

describe('useLayerSelection - centerOnLayer', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('retorna false si no hay layerId', async () => {
        const mapRef = { current: buildMockMap() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.centerOnLayer(null);
        expect(ok).toBe(false);
    });

    it('retorna false si la capa no existe en allLayers', async () => {
        const mapRef = { current: buildMockMap() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.centerOnLayer('inexistente');
        expect(ok).toBe(false);
    });

    it('retorna false si no se obtiene extent', async () => {
        vi.spyOn(capabilitiesService, 'getLayerExtent3857').mockResolvedValue(null);
        const mapRef = { current: buildMockMap() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.centerOnLayer('cap-1');
        expect(ok).toBe(false);
    });

    it('invoca view.fit cuando hay extent y mapa activo', async () => {
        vi.spyOn(capabilitiesService, 'getLayerExtent3857').mockResolvedValue([10, 20, 30, 40]);
        const view = { fit: vi.fn(), calculateExtent: () => [0, 0, 100, 100] };
        const map = { getSize: () => [800, 600], getView: () => view, addLayer: vi.fn(), removeLayer: vi.fn() };
        const mapRef = { current: map };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.centerOnLayer('cap-1');
        expect(ok).toBe(true);
        expect(view.fit).toHaveBeenCalledWith([10, 20, 30, 40], expect.objectContaining({
            duration: 500,
            maxZoom: 16,
        }));
    });

    it('en compareMode aplica fit a cada paneMapInstance', async () => {
        vi.spyOn(capabilitiesService, 'getLayerExtent3857').mockResolvedValue([10, 20, 30, 40]);
        const paneA = buildMockMap();
        const paneB = buildMockMap();
        const { result } = renderHook(() => useLayerSelection({
            mapRef: { current: null },
            paneMapInstances: { 0: paneA, 1: paneB },
            compareMode: { active: true },
            allLayers: buildLayers(),
        }));
        await result.current.centerOnLayer('cap-1');
        expect(paneA.getView().fit).toHaveBeenCalled();
        expect(paneB.getView().fit).toHaveBeenCalled();
    });
});

describe('useLayerSelection - pulseLayer', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('retorna false si no hay layerId', async () => {
        const mapRef = { current: buildMockMap() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.pulseLayer(null);
        expect(ok).toBe(false);
    });

    it('retorna false sin extent disponible', async () => {
        vi.spyOn(capabilitiesService, 'getLayerExtent3857').mockResolvedValue(null);
        const mapRef = { current: buildMockMap() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.pulseLayer('cap-1');
        expect(ok).toBe(false);
    });

    it('agrega capa overlay al map y arranca animación', async () => {
        vi.spyOn(capabilitiesService, 'getLayerExtent3857').mockResolvedValue([10, 20, 30, 40]);
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
        const map = buildMockMap();
        const mapRef = { current: map };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.pulseLayer('cap-1');
        expect(ok).toBe(true);
        expect(map.addLayer).toHaveBeenCalled();
        expect(rafSpy).toHaveBeenCalled();
    });

    it('al desmontar limpia animación y remueve el overlay', async () => {
        vi.spyOn(capabilitiesService, 'getLayerExtent3857').mockResolvedValue([10, 20, 30, 40]);
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
        const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const map = buildMockMap();
        const mapRef = { current: map };
        const { result, unmount } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        await act(async () => { await result.current.pulseLayer('cap-1'); });
        unmount();
        expect(cancelSpy).toHaveBeenCalled();
    });
});
