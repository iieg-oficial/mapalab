import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayerSelection } from '@pages/maps/hooks/useLayerSelectionPulse';
import * as capabilitiesService from '@services/wmsCapabilitiesService';

const buildMockLayer = (mergedSubIds = null, opacity = 1) => {
    const ol = {
        _opacity: opacity,
        getOpacity: () => ol._opacity,
        setOpacity: vi.fn((o) => { ol._opacity = o; }),
        get: vi.fn((key) => (key === 'mergedLayers' && mergedSubIds
            ? [{ subLayers: mergedSubIds.map(id => ({ id })) }]
            : null)),
    };
    return ol;
};

const buildMockMap = (extent = [0, 0, 100, 100], olLayers = []) => {
    const view = { fit: vi.fn(), calculateExtent: () => extent };
    return {
        getSize: () => [800, 600],
        getView: () => view,
        getLayers: () => ({ forEach: (cb) => olLayers.forEach(cb) }),
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

    it('F2 fallback: si la capa no resuelve extent, cae al ancestro/grupo que sí', async () => {
        const layers = [{
            id: 'grupo',
            label: 'Grupo',
            children: [
                { id: 'hijo-1', wmsConfig: { workspace: 'a', geoserverLayer: 'x', baseUrl: 'http://gs/a/wms', layerName: 'a:x' } },
                { id: 'hijo-2', wmsConfig: { workspace: 'a', geoserverLayer: 'y', baseUrl: 'http://gs/a/wms', layerName: 'a:y' } },
            ],
        }];
        vi.spyOn(capabilitiesService, 'getLayerExtent3857')
            .mockImplementation(async (cfg) => cfg.layerName === 'a:y' ? [20, 20, 30, 30] : null);
        const view = { fit: vi.fn(), calculateExtent: () => [0, 0, 100, 100] };
        const map = { getSize: () => [800, 600], getView: () => view, addLayer: vi.fn(), removeLayer: vi.fn() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef: { current: map }, paneMapInstances: {}, compareMode: { active: false }, allLayers: layers,
        }));
        const ok = await result.current.centerOnLayer('hijo-1');
        expect(ok).toBe(true);
        expect(view.fit).toHaveBeenCalledWith([20, 20, 30, 30], expect.objectContaining({ maxZoom: 16 }));
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

describe('useLayerSelection - capa grupo (sin wmsConfig directo)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('une los extents de todos los descendientes con wmsConfig', async () => {
        const layers = [{
            id: 'grupo',
            label: 'Grupo',
            children: [
                {
                    id: 'hijo-1',
                    wmsConfig: { workspace: 'a', geoserverLayer: 'x', baseUrl: 'http://gs/a/wms', layerName: 'a:x' },
                },
                {
                    id: 'hijo-2',
                    wmsConfig: { workspace: 'a', geoserverLayer: 'y', baseUrl: 'http://gs/a/wms', layerName: 'a:y' },
                },
            ],
        }];
        vi.spyOn(capabilitiesService, 'getLayerExtent3857')
            .mockImplementation(async (cfg) => cfg.layerName === 'a:x' ? [0, 0, 10, 10] : [20, 20, 30, 30]);
        const view = { fit: vi.fn(), calculateExtent: () => [0, 0, 100, 100] };
        const map = { getSize: () => [800, 600], getView: () => view, addLayer: vi.fn(), removeLayer: vi.fn() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef: { current: map }, paneMapInstances: {}, compareMode: { active: false }, allLayers: layers,
        }));
        const ok = await result.current.centerOnLayer('grupo');
        expect(ok).toBe(true);
        expect(view.fit).toHaveBeenCalledWith([0, 0, 30, 30], expect.any(Object));
    });

    it('retorna false si ningún descendiente tiene wmsConfig', async () => {
        const layers = [{ id: 'grupo', children: [{ id: 'hijo' }] }];
        const mapRef = { current: buildMockMap() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: layers,
        }));
        const ok = await result.current.centerOnLayer('grupo');
        expect(ok).toBe(false);
    });
});

describe('useLayerSelection - pulseLayer', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('retorna false si layerId no tiene wms en allLayers', async () => {
        const mapRef = { current: buildMockMap() };
        const { result } = renderHook(() => useLayerSelection({
            mapRef, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.pulseLayer('inexistente');
        expect(ok).toBe(false);
    });

    it('atenúa las capas WMS que NO contienen el layerId seleccionado', async () => {
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
        const otra = buildMockLayer(['cap-2'], 1);
        const selectedLayer = buildMockLayer(['cap-1'], 1);
        const map = buildMockMap([0, 0, 100, 100], [otra, selectedLayer]);
        const { result } = renderHook(() => useLayerSelection({
            mapRef: { current: map }, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.pulseLayer('cap-1');
        expect(ok).toBe(true);
        expect(otra.setOpacity).toHaveBeenCalledWith(0);
        expect(selectedLayer.setOpacity).not.toHaveBeenCalled();
    });


    it('capa de evento (grupo con hermana): monta overlay y NO atenúa el grupo hasta que el overlay carga (sin parpadeo)', async () => {
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
        const grupo = {
            _opacity: 1,
            getOpacity: () => grupo._opacity,
            setOpacity: vi.fn((o) => { grupo._opacity = o; }),
            get: vi.fn((key) => (key === 'mergedLayers'
                ? [{ subLayers: [{ id: 'cap-1' }] }, { subLayers: [{ id: 'cap-2' }] }]
                : null)),
            getSource: () => ({
                getParams: () => ({ LAYERS: 'ws:a,ws:b' }),
                getUrl: () => 'http://gs/ws/wms',
            }),
        };
        const map = buildMockMap([0, 0, 100, 100], [grupo]);
        const { result } = renderHook(() => useLayerSelection({
            mapRef: { current: map }, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        const ok = await result.current.pulseLayer('cap-1');
        expect(ok).toBe(true);
        expect(map.addLayer).toHaveBeenCalledTimes(1);
        expect(grupo.setOpacity).not.toHaveBeenCalled();
    });

    it('al desmontar limpia animación y restaura opacidades originales', async () => {
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
        const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const otra = buildMockLayer(['cap-2'], 0.8);
        const map = buildMockMap([0, 0, 100, 100], [otra]);
        const { result, unmount } = renderHook(() => useLayerSelection({
            mapRef: { current: map }, paneMapInstances: {}, compareMode: { active: false }, allLayers: buildLayers(),
        }));
        await act(async () => { await result.current.pulseLayer('cap-1'); });
        unmount();
        expect(cancelSpy).toHaveBeenCalled();
        expect(otra.setOpacity).toHaveBeenLastCalledWith(0.8);
    });
});
