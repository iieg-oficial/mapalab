import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { fromLonLat } from 'ol/proj';

const { contexto, mapa, reloj } = vi.hoisted(() => ({
    reloj: { hora: 0 },
    contexto: { valor: null },
    mapa: { handlers: new Map(), centro: null, zoom: 11 },
}));

vi.mock('@hooks/useMaps', () => ({ useMapsContext: () => contexto.valor }));
vi.mock('react-router', () => ({ useSearchParams: () => [new URLSearchParams('s=k7Qm2x')] }));

import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';
import { marcarShareAplicado } from '@pages/maps/helpers/shareAplicacion';

const mapaFalso = {
    on: (evento, fn) => mapa.handlers.set(evento, fn),
    un: (evento) => mapa.handlers.delete(evento),
    getView: () => ({ getCenter: () => mapa.centro, getZoom: () => mapa.zoom }),
};

const moverA = (lon, lat, zoom = mapa.zoom) => {
    mapa.centro = fromLonLat([lon, lat]);
    mapa.zoom = zoom;
    act(() => { mapa.handlers.get('moveend')?.(); });
};

const esperar = (ms) => act(() => { vi.advanceTimersByTime(ms); });

const conCapas = (capas) => ({
    mapRef: { current: mapaFalso },
    activeLayerIds: capas,
    filters: {},
    layerOpacities: new Map(),
    hiddenLayerIds: [],
    selectedLayerForSymbology: null,
    baseMapId: 'claro',
});

describe('useShareDirtiness', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        reloj.hora += 1;
        vi.setSystemTime(new Date(Date.UTC(2026, 8, 10, reloj.hora)));
        mapa.handlers.clear();
        mapa.centro = fromLonLat([-103.35, 20.66]);
        mapa.zoom = 11;
        contexto.valor = conCapas(['limites']);
    });

    afterEach(() => vi.useRealTimers());

    it('mover el mapa despues de cargar el enlace lo marca como modificado', () => {
        const { result } = renderHook(() => useShareDirtiness());
        esperar(1000);
        moverA(-103.2, 20.7);
        expect(result.current.isDirty).toBe(true);
    });

    it('acercar o alejar tambien lo marca como modificado', () => {
        const { result } = renderHook(() => useShareDirtiness());
        esperar(1000);
        moverA(-103.35, 20.66, 13);
        expect(result.current.isDirty).toBe(true);
    });

    it('el movimiento que hace el propio enlace al aplicarse no cuenta', () => {
        const { result } = renderHook(() => useShareDirtiness());
        esperar(2000);
        marcarShareAplicado();
        moverA(-103.1, 20.9, 12);
        expect(result.current.isDirty).toBe(false);
        esperar(1000);
        moverA(-103.0, 21.0, 12);
        expect(result.current.isDirty).toBe(true);
    });

    it('si el enlace tarda en aplicarse, sus capas no cuentan como cambio', () => {
        const { result, rerender } = renderHook(() => useShareDirtiness());
        esperar(2000);
        marcarShareAplicado();
        contexto.valor = conCapas(['limites', 'temperatura']);
        rerender();
        expect(result.current.isDirty).toBe(false);
    });

    it('cambiar capas despues de cargado si lo marca como modificado', () => {
        const { result, rerender } = renderHook(() => useShareDirtiness());
        esperar(1000);
        contexto.valor = conCapas(['limites', 'temperatura']);
        rerender();
        expect(result.current.isDirty).toBe(true);
    });

    it('restaurar limpia el estado y toma la vista restaurada como referencia', () => {
        const { result } = renderHook(() => useShareDirtiness());
        esperar(1000);
        moverA(-103.2, 20.7);
        expect(result.current.isDirty).toBe(true);
        mapa.centro = fromLonLat([-103.35, 20.66]);
        act(() => result.current.reset());
        expect(result.current.isDirty).toBe(false);
        esperar(1000);
        moverA(-103.35, 20.66);
        expect(result.current.isDirty).toBe(false);
    });
});
