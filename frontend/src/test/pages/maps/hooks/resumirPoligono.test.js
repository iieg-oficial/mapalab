import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { usePolygonSelection } from '@hooksMaps/usePolygonSelection';

vi.mock('@services/featureInfoService', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, getFeaturesInPolygonForActiveLayers: vi.fn() };
});

vi.mock('@services/seleccionStatsService', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, contarEnPoligono: vi.fn() };
});

const { getFeaturesInPolygonForActiveLayers } = await import('@services/featureInfoService');
const { contarEnPoligono } = await import('@services/seleccionStatsService');

const capa = (id) => ({ id, label: id, wmsConfig: { baseUrl: 'https://geo.test/ws/wms', layerName: `ws:${id}`, workspace: 'ws' } });
const allLayers = [capa('escuelas'), capa('hospitales'), capa('vacia')];
const activeLayers = allLayers.map(({ id }) => ({ id, name: id, visible: true }));
const args = { map: {}, polygonGeometry: {}, activeLayers, allLayers };

describe('resumirPoligono', () => {
    beforeEach(() => {
        getFeaturesInPolygonForActiveLayers.mockReset();
        contarEnPoligono.mockReset();
    });

    it('cuenta por capa sin pedir elementos', async () => {
        contarEnPoligono.mockResolvedValue([
            { id: 'escuelas', etiqueta: 'escuelas', conteo: 1284, enBorde: 3 },
            { id: 'hospitales', etiqueta: 'hospitales', conteo: 12 },
            { id: 'vacia', etiqueta: 'vacia', conteo: 0 },
        ]);

        const { result } = renderHook(() => usePolygonSelection({ getFilter: null }));
        const resumen = await result.current.resumirPoligono(args);

        expect(getFeaturesInPolygonForActiveLayers).not.toHaveBeenCalled();
        expect(resumen.matched).toBe(1296);
        expect(resumen.enBorde).toBe(3);
        expect(resumen.resumen.map(fila => fila.layerId)).toEqual(['escuelas', 'hospitales']);
        expect(result.current.polygonPageRef.current).toMatchObject({ nextIndex: 0, hasMore: true, matched: 1296 });
    });

    it('la primera página de elementos se pide hasta que se solicita', async () => {
        contarEnPoligono.mockResolvedValue([{ id: 'escuelas', etiqueta: 'escuelas', conteo: 5 }]);
        getFeaturesInPolygonForActiveLayers.mockResolvedValue({ results: [], matched: 5, nextIndex: 5, hasMore: false });

        const { result } = renderHook(() => usePolygonSelection({ getFilter: null }));
        await result.current.resumirPoligono(args);
        await result.current.loadMorePage();

        expect(getFeaturesInPolygonForActiveLayers).toHaveBeenCalledTimes(1);
        expect(getFeaturesInPolygonForActiveLayers.mock.calls[0][6]).toEqual({ startIndex: 0 });
    });

    it('sin nada adentro no deja paginación pendiente', async () => {
        contarEnPoligono.mockResolvedValue([{ id: 'escuelas', etiqueta: 'escuelas', conteo: 0 }]);

        const { result } = renderHook(() => usePolygonSelection({ getFilter: null }));
        const resumen = await result.current.resumirPoligono(args);

        expect(resumen.matched).toBe(0);
        expect(result.current.polygonPageRef.current.hasMore).toBe(false);
    });

    it('una capa que no se pudo contar queda en el resumen como sin dato', async () => {
        contarEnPoligono.mockResolvedValue([
            { id: 'escuelas', etiqueta: 'escuelas', conteo: null },
            { id: 'hospitales', etiqueta: 'hospitales', conteo: null, sinWfs: true },
        ]);

        const { result } = renderHook(() => usePolygonSelection({ getFilter: null }));
        const resumen = await result.current.resumirPoligono(args);

        expect(resumen.resumen).toEqual([{ layerId: 'escuelas', layerName: 'escuelas', conteo: null }]);
        expect(resumen.matched).toBe(0);
        expect(result.current.polygonPageRef.current.hasMore).toBe(true);
    });
});
