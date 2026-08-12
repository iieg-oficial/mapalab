import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayerServiceMode } from '@hooksMaps/useLayerServiceMode';
import { SERVICE_WMS, SERVICE_VECTOR } from '@pages/maps/helpers/serviceMode';

const noChildren = () => [];

const render = (activeLayerIds = ['capa'], getAllChildLayerIds = noChildren) =>
    renderHook(({ ids }) => useLayerServiceMode(getAllChildLayerIds, ids), {
        initialProps: { ids: activeLayerIds }
    });

describe('useLayerServiceMode', () => {
    it('arranca en WMS', () => {
        const { result } = render();
        expect(result.current.getServiceMode('capa')).toBe(SERVICE_WMS);
    });

    it('cambia y regresa el modo de una capa', () => {
        const { result } = render();

        act(() => result.current.setServiceMode('capa', SERVICE_VECTOR));
        expect(result.current.getServiceMode('capa')).toBe(SERVICE_VECTOR);

        act(() => result.current.setServiceMode('capa', SERVICE_WMS));
        expect(result.current.getServiceMode('capa')).toBe(SERVICE_WMS);
        expect(result.current.layerServiceModes.has('capa')).toBe(false);
    });

    it('no propaga el modo a las capas hijas', () => {
        const { result } = render(['grupo'], () => ['hija']);
        act(() => result.current.setServiceMode('grupo', SERVICE_VECTOR));
        expect(result.current.getServiceMode('hija')).toBe(SERVICE_WMS);
    });

    it('purga el modo cuando la capa deja de estar activa', () => {
        const { result, rerender } = render(['capa']);

        act(() => result.current.setServiceMode('capa', SERVICE_VECTOR));
        expect(result.current.layerServiceModes.size).toBe(1);

        rerender({ ids: [] });
        expect(result.current.layerServiceModes.size).toBe(0);
    });

    it('el rechazo devuelve la capa a WMS y guarda el motivo', () => {
        const { result } = render();

        act(() => result.current.setServiceMode('capa', SERVICE_VECTOR));
        act(() => result.current.rejectVectorMode('capa', { reason: 'too-large', count: 90000 }));

        expect(result.current.getServiceMode('capa')).toBe(SERVICE_WMS);
        expect(result.current.getVectorRejection('capa')).toEqual({ reason: 'too-large', count: 90000 });
    });

    it('un nuevo intento limpia el rechazo anterior', () => {
        const { result } = render();

        act(() => result.current.rejectVectorMode('capa', { reason: 'error' }));
        act(() => result.current.setServiceMode('capa', SERVICE_VECTOR));

        expect(result.current.getVectorRejection('capa')).toBe(null);
    });
});
