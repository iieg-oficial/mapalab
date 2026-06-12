import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import MapsContext from '@contexts/MapsContext';
import { useLayerSymbolIcon } from '@hooksMaps/useLayerSymbolIcon';

const mockLayers = [
    {
        id: 'edad_mediana',
        label: 'Edad mediana',
        wmsConfig: { baseUrl: '/geoserver/demografia/wms', layerName: 'demografia:edad_mediana' }
    },
    {
        id: 'grupo',
        children: [
            {
                id: 'hija_wms',
                label: 'Hija',
                wmsConfig: { baseUrl: '/geoserver/demografia/wms', layerName: 'demografia:hija' }
            }
        ]
    },
    {
        id: 'sin_names',
        label: 'Sin nombres de regla',
        wmsConfig: { baseUrl: '/geoserver/demografia/wms', layerName: 'demografia:sin_names' }
    },
    {
        id: 'capa_error',
        label: 'Capa con error',
        wmsConfig: { baseUrl: '/geoserver/demografia/wms', layerName: 'demografia:capa_error' }
    }
];

vi.mock('@hooks/useLayers', () => ({
    useLayers: () => ({ layers: mockLayers, initialOrder: [], loading: false, error: null })
}));

const wrapper = ({ children }) => (
    <MapsContext.Provider value={{ getFilter: () => null }}>
        {children}
    </MapsContext.Provider>
);

const legendJson = (rules) => ({
    ok: true,
    json: async () => ({ Legend: [{ rules }] })
});

describe('useLayerSymbolIcon', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('resuelve icono con rule cuando hay varias reglas con nombre', async () => {
        global.fetch = vi.fn().mockResolvedValue(legendJson([
            { name: 'c1', title: '0 a 18' },
            { name: 'c2', title: '19 a 30' }
        ]));

        const { result } = renderHook(() => useLayerSymbolIcon('edad_mediana'), { wrapper });

        await waitFor(() => expect(result.current).toBeTruthy());
        expect(result.current).toContain('GetLegendGraphic');
        expect(result.current).toContain('rule=c1');
        expect(result.current).toContain('forceLabels:off');
    });

    it('resuelve icono sin rule cuando hay una sola regla', async () => {
        global.fetch = vi.fn().mockResolvedValue(legendJson([{ title: 'unica' }]));

        const { result } = renderHook(() => useLayerSymbolIcon('hija_wms'), { wrapper });

        await waitFor(() => expect(result.current).toBeTruthy());
        expect(result.current).not.toContain('rule=');
    });

    it('resuelve via childIds cuando el id es un grupo', async () => {
        global.fetch = vi.fn().mockResolvedValue(legendJson([{ title: 'unica' }]));

        const { result } = renderHook(() => useLayerSymbolIcon('grupo'), { wrapper });

        await waitFor(() => expect(result.current).toBeTruthy());
        expect(result.current).toContain('demografia:hija');
    });

    it('cae a leyenda icon-only sin rule cuando las reglas no tienen nombre', async () => {
        global.fetch = vi.fn().mockResolvedValue(legendJson([
            { title: '0 a 18' },
            { title: '19 a 30' }
        ]));

        const { result } = renderHook(() => useLayerSymbolIcon('sin_names'), { wrapper });

        await waitFor(() => expect(result.current).toBeTruthy());
        expect(result.current).not.toContain('rule=');
    });

    it('retorna null sin cachear cuando el fetch falla', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('network'));

        const { result, unmount } = renderHook(() => useLayerSymbolIcon('capa_error'), { wrapper });

        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        expect(result.current).toBeNull();
        unmount();

        global.fetch = vi.fn().mockResolvedValue(legendJson([{ name: 'c1', title: 'recuperada' }]));
        const { result: retry } = renderHook(() => useLayerSymbolIcon('capa_error'), { wrapper });

        await waitFor(() => expect(retry.current).toBeTruthy());
    });
});
