import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockUseMapsContext, mockUseTablaAtributos, mockFijarVista } = vi.hoisted(() => ({
    mockUseMapsContext: vi.fn(),
    mockUseTablaAtributos: vi.fn(),
    mockFijarVista: vi.fn(),
}));

vi.mock('@hooks/useMaps', () => ({
    useMapsContext: () => mockUseMapsContext(),
}));

vi.mock('@contexts/TablaAtributosContext', () => ({
    useTablaAtributos: () => mockUseTablaAtributos(),
}));

vi.mock('@hooks/useDebounce', () => ({
    useDebounce: (valor) => valor,
}));

import { useTablaVista } from '@hooksMaps/useTablaVista';

const EXTENT = [-11700000, 2200000, -11400000, 2500000];

const mapaFalso = (extent = EXTENT) => {
    const handlers = {};
    return {
        getView: () => ({ calculateExtent: () => extent }),
        getSize: () => [800, 600],
        on: vi.fn((evento, fn) => { handlers[evento] = fn; }),
        un: vi.fn(),
        mover: () => handlers.moveend?.(),
    };
};

const montar = (ctx) => {
    mockUseMapsContext.mockReturnValue(ctx);
    mockUseTablaAtributos.mockReturnValue({
        estadoDe: () => ({ vista: 'visible', bboxCongelado: null }),
        fijarVista: mockFijarVista,
    });
    return renderHook(() => useTablaVista('temperatura_media_mensual'));
};

describe('useTablaVista', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sigue el encuadre del mapa live cuando no hay comparador', () => {
        const mapa = mapaFalso();
        const { result } = montar({ mapRef: { current: mapa }, paneMapInstances: {} });
        expect(result.current.extent).toEqual(EXTENT);
        expect(mapa.on).toHaveBeenCalledWith('moveend', expect.any(Function));
    });

    it('cae al pane α cuando el mapa live es null, que es lo que pasa en el comparador', () => {
        const paneA = mapaFalso();
        const { result } = montar({ mapRef: { current: null }, paneMapInstances: { 0: paneA } });
        expect(result.current.extent).toEqual(EXTENT);
        expect(paneA.on).toHaveBeenCalledWith('moveend', expect.any(Function));
    });

    it('se engancha al pane α en cuanto aparece, aunque al montar no existiera', () => {
        const paneA = mapaFalso();
        mockUseTablaAtributos.mockReturnValue({
            estadoDe: () => ({ vista: 'visible', bboxCongelado: null }),
            fijarVista: mockFijarVista,
        });
        const { result, rerender } = renderHook(
            ({ ctx }) => {
                mockUseMapsContext.mockReturnValue(ctx);
                return useTablaVista('temperatura_media_mensual');
            },
            { initialProps: { ctx: { mapRef: { current: null }, paneMapInstances: {} } } },
        );
        expect(result.current.extent).toBeNull();

        rerender({ ctx: { mapRef: { current: null }, paneMapInstances: { 0: paneA } } });
        expect(result.current.extent).toEqual(EXTENT);
    });

    it('congela con el encuadre del pane α sin mapa live', () => {
        const paneA = mapaFalso();
        const { result } = montar({ mapRef: { current: null }, paneMapInstances: { 0: paneA } });
        act(() => { result.current.congelar(); });
        expect(mockFijarVista).toHaveBeenCalledWith('temperatura_media_mensual', 'congelada', EXTENT);
    });

    it('vuelve a medir cuando el mapa se mueve', () => {
        const paneA = mapaFalso();
        const { result } = montar({ mapRef: { current: null }, paneMapInstances: { 0: paneA } });
        act(() => { paneA.mover(); });
        expect(result.current.extent).toEqual(EXTENT);
    });
});
