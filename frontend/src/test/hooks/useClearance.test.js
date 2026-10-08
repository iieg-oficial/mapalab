import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClearance } from '@hooks/useClearance';

const conCaja = (caja) => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0, ...caja });
    return { current: el };
};

beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
        observe = vi.fn();
        disconnect = vi.fn();
    });
    vi.stubGlobal('requestAnimationFrame', (cb) => { cb(); return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    window.innerHeight = 800;
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useClearance', () => {
    it('devuelve la base cuando nada se cruza', () => {
        const objetivo = conCaja({ width: 200, height: 40, left: 400, right: 600 });
        const lejos = conCaja({ width: 100, height: 40, left: 0, right: 100, top: 16, bottom: 56 });
        const { result } = renderHook(() => useClearance(objetivo, { obstaculos: [lejos], base: 16 }));
        expect(result.current).toBe(16);
    });

    it('baja lo justo para librar un obstaculo que se cruza', () => {
        const objetivo = conCaja({ width: 200, height: 40, left: 400, right: 600 });
        const encima = conCaja({ width: 300, height: 44, left: 500, right: 800, top: 16, bottom: 60 });
        const { result } = renderHook(() => useClearance(objetivo, { obstaculos: [encima], base: 16, separacion: 16 }));
        expect(result.current).toBe(76);
    });

    it('ignora al que se cruza en horizontal pero no en vertical', () => {
        const objetivo = conCaja({ width: 200, height: 40, left: 400, right: 600 });
        const abajo = conCaja({ width: 300, height: 44, left: 500, right: 800, top: 700, bottom: 744 });
        const { result } = renderHook(() => useClearance(objetivo, { obstaculos: [abajo], base: 16 }));
        expect(result.current).toBe(16);
    });

    it('desde abajo sube lo necesario para no tapar el obstaculo', () => {
        const objetivo = conCaja({ width: 200, height: 40, left: 0, right: 200 });
        const escala = conCaja({ width: 120, height: 20, left: 0, right: 120, top: 770, bottom: 790 });
        const { result } = renderHook(() => useClearance(objetivo, {
            lado: 'bottom', obstaculos: [escala], base: 8, separacion: 8,
        }));
        expect(result.current).toBe(38);
    });

    it('acepta selectores ademas de referencias', () => {
        const nodo = document.createElement('div');
        nodo.className = 'ol-scale-line';
        nodo.getBoundingClientRect = () => ({ width: 120, height: 20, top: 770, bottom: 790, left: 0, right: 120 });
        document.body.appendChild(nodo);
        const objetivo = conCaja({ width: 200, height: 40, left: 0, right: 200 });
        const { result } = renderHook(() => useClearance(objetivo, {
            lado: 'bottom', obstaculos: ['.ol-scale-line'], base: 8, separacion: 8,
        }));
        expect(result.current).toBe(38);
        nodo.remove();
    });

    it('se queda en la base cuando esta inactivo', () => {
        const objetivo = conCaja({ width: 200, height: 40, left: 400, right: 600 });
        const encima = conCaja({ width: 300, height: 44, left: 500, right: 800, top: 16, bottom: 60 });
        const { result } = renderHook(() => useClearance(objetivo, {
            obstaculos: [encima], base: 16, activo: false,
        }));
        expect(result.current).toBe(16);
    });
});
