import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useDescargaDeInfoBox, TOPE_DESCARGA_POLIGONO } from '@pages/maps/components/InfoBox/hooks/useDescargaDeInfoBox';

vi.mock('@pages/maps/components/InfoBox/utils/downloadFeatures', () => ({ downloadFeaturesAsCSV: vi.fn() }));
const { downloadFeaturesAsCSV } = await import('@pages/maps/components/InfoBox/utils/downloadFeatures');

const lazyLoad = (totalFeatures = 0) => ({
    totalFeatures,
    downloadDisplayCount: totalFeatures,
    downloadShowsPlus: false,
    downloadTooltipText: 'Descargar',
    enrichResultsForDownload: vi.fn(async () => [{ layerId: 'a', features: [] }]),
});

describe('useDescargaDeInfoBox', () => {
    beforeEach(() => downloadFeaturesAsCSV.mockReset());

    it('en una selección con solo el resumen ofrece descargar y pide los elementos al momento', async () => {
        const resultados = [{ layerId: 'escuelas', features: [{ id: 1 }] }];
        const pedirParaDescarga = vi.fn(async () => ({ results: resultados }));
        const info = { isPolygonSelection: true, matched: 1284, results: [], resumen: [{ layerId: 'escuelas', conteo: 1284 }] };
        const { result } = renderHook(() => useDescargaDeInfoBox({ selectedFeatureInfo: info, lazyLoad: lazyLoad(), allLayers: [], pedirParaDescarga }));

        expect(result.current.onDownload).toBeTypeOf('function');
        expect(result.current.downloadCount).toBe(1284);
        await act(() => result.current.onDownload());
        expect(pedirParaDescarga).toHaveBeenCalledWith(TOPE_DESCARGA_POLIGONO);
        expect(downloadFeaturesAsCSV).toHaveBeenCalledWith(resultados, []);
    });

    it('arriba del tope avisa que es parcial', () => {
        const info = { isPolygonSelection: true, matched: TOPE_DESCARGA_POLIGONO + 10, results: [] };
        const { result } = renderHook(() => useDescargaDeInfoBox({ selectedFeatureInfo: info, lazyLoad: lazyLoad(), allLayers: [], pedirParaDescarga: vi.fn() }));

        expect(result.current.downloadCount).toBe(TOPE_DESCARGA_POLIGONO);
        expect(result.current.downloadShowsPlus).toBe(true);
    });

    it('fuera de una selección conserva la descarga de lo cargado y la oculta con una sola tarjeta', () => {
        const uno = renderHook(() => useDescargaDeInfoBox({ selectedFeatureInfo: { results: [{}] }, lazyLoad: lazyLoad(1), allLayers: [], pedirParaDescarga: vi.fn() }));
        const varios = renderHook(() => useDescargaDeInfoBox({ selectedFeatureInfo: { results: [{}] }, lazyLoad: lazyLoad(3), allLayers: [], pedirParaDescarga: vi.fn() }));

        expect(uno.result.current.onDownload).toBeNull();
        expect(varios.result.current.onDownload).toBeTypeOf('function');
    });
});
