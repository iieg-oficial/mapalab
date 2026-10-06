import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResaltadoCapa } from '@pages/maps/hooks/useResaltadoCapa';
import { fijarCapaResaltada, soltarCapaResaltada } from '@pages/maps/helpers/layers/capaResaltada';
import * as aislar from '@pages/maps/helpers/layers/aislarCapa';

const capaOl = (subIds, { opacidad = 1, visible = true } = {}) => {
    const props = { mergedLayers: [{ subLayers: subIds.map(id => ({ id })) }] };
    const ol = {
        _o: opacidad,
        getOpacity: () => ol._o,
        setOpacity: vi.fn((o) => { ol._o = o; }),
        getVisible: () => visible,
        get: (k) => props[k],
        set: (k, v) => { props[k] = v; },
        getSource: () => ({ getParams: () => ({ LAYERS: subIds.join(',') }) }),
    };
    return ol;
};

const mapa = (capas) => ({
    getLayers: () => ({ forEach: (cb) => capas.forEach(cb) }),
    getView: () => ({ getCenter: () => [0, 0], getResolution: () => 1 }),
    getSize: () => [800, 600],
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
});

const arbol = [
    { id: 'a', wmsConfig: { layerName: 'ws:a' } },
    { id: 'b', wmsConfig: { layerName: 'ws:b' } },
];

const montar = (map, extra = {}) => renderHook(() => useResaltadoCapa({
    mapRef: { current: map }, paneMapInstances: {}, compareMode: null, allLayers: arbol, cancelPulse: vi.fn(), ...extra,
}));

describe('useResaltadoCapa', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    });
    afterEach(() => {
        act(() => fijarCapaResaltada(null));
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('atenúa las demás capas y deja la resaltada', () => {
        const a = capaOl(['a']);
        const b = capaOl(['b'], { opacidad: 0.8 });
        const cancelPulse = vi.fn();
        montar(mapa([a, b]), { cancelPulse });
        act(() => { fijarCapaResaltada('a'); vi.advanceTimersByTime(400); });
        expect(a.getOpacity()).toBe(1);
        expect(b.getOpacity()).toBeCloseTo(0.16);
        expect(cancelPulse).toHaveBeenCalled();
    });

    it('al salir regresa la opacidad original', () => {
        const a = capaOl(['a']);
        const b = capaOl(['b'], { opacidad: 0.8 });
        montar(mapa([a, b]));
        act(() => { fijarCapaResaltada('a'); vi.advanceTimersByTime(400); });
        act(() => { soltarCapaResaltada('a'); vi.advanceTimersByTime(400); });
        expect(b.getOpacity()).toBeCloseTo(0.8);
    });

    it('hovers seguidos no acumulan atenuado aunque el regreso no haya terminado', () => {
        const a = capaOl(['a']);
        const b = capaOl(['b'], { opacidad: 0.8 });
        const c = capaOl(['c'], { opacidad: 0.5 });
        montar(mapa([a, b, c]));
        for (let i = 0; i < 5; i++) {
            act(() => { fijarCapaResaltada('a'); vi.advanceTimersByTime(400); });
            act(() => { soltarCapaResaltada('a'); vi.advanceTimersByTime(40); });
            act(() => { fijarCapaResaltada('b'); vi.advanceTimersByTime(400); });
            expect(c.getOpacity()).toBeCloseTo(0.1);
            act(() => { soltarCapaResaltada('b'); vi.advanceTimersByTime(40); });
        }
        act(() => { vi.advanceTimersByTime(400); });
        expect(a.getOpacity()).toBeCloseTo(1);
        expect(b.getOpacity()).toBeCloseTo(0.8);
        expect(c.getOpacity()).toBeCloseTo(0.5);
    });

    it('no toca capas ocultas', () => {
        const a = capaOl(['a']);
        const b = capaOl(['b'], { visible: false });
        montar(mapa([a, b]));
        act(() => { fijarCapaResaltada('a'); vi.advanceTimersByTime(400); });
        expect(b.setOpacity).not.toHaveBeenCalled();
    });

    it('si comparte imagen pide una capa aparte tras la espera y atenúa la compartida cuando carga', () => {
        const compartida = capaOl(['a', 'b']);
        compartida.get = (k) => (k === 'mergedLayers' ? [{ subLayers: [{ id: 'a' }] }, { subLayers: [{ id: 'b' }] }] : undefined);
        const props = {};
        let alCargar = null;
        const overlay = {
            get: (k) => props[k],
            set: (k, v) => { props[k] = v; },
            getSource: () => ({ once: (_, cb) => { alCargar = cb; } }),
        };
        vi.spyOn(aislar, 'buildTargetOverlay').mockReturnValue(overlay);
        const m = mapa([compartida]);
        montar(m);
        act(() => { fijarCapaResaltada('a'); });
        expect(m.addLayer).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(200); });
        expect(m.addLayer).toHaveBeenCalledWith(overlay);
        expect(compartida.setOpacity).not.toHaveBeenCalled();
        act(() => { alCargar(); vi.advanceTimersByTime(400); });
        expect(compartida.getOpacity()).toBeCloseTo(0.2);
        act(() => { soltarCapaResaltada('a'); vi.advanceTimersByTime(400); });
        expect(m.removeLayer).toHaveBeenCalledWith(overlay);
        expect(compartida.getOpacity()).toBeCloseTo(1);
    });

    it('si el puntero sale antes de la espera no pide nada', () => {
        const compartida = capaOl(['a', 'b']);
        compartida.get = (k) => (k === 'mergedLayers' ? [{ subLayers: [{ id: 'a' }] }, { subLayers: [{ id: 'b' }] }] : undefined);
        const espia = vi.spyOn(aislar, 'buildTargetOverlay');
        const m = mapa([compartida]);
        montar(m);
        act(() => { fijarCapaResaltada('a'); vi.advanceTimersByTime(100); soltarCapaResaltada('a'); vi.advanceTimersByTime(500); });
        expect(espia).not.toHaveBeenCalled();
        expect(m.addLayer).not.toHaveBeenCalled();
    });
});
