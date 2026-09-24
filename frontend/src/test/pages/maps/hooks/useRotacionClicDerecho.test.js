import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { RotarConClicDerecho, useRotacionClicDerecho } from '@pages/maps/hooks/useRotacionClicDerecho';

const evento = (button, pointerType = 'mouse') => {
    const view = { beginInteraction: vi.fn() };
    return { view, e: { originalEvent: { pointerId: 1, button, pointerType }, map: { getView: () => view } } };
};

describe('RotarConClicDerecho', () => {
    it('arranca solo con el boton derecho del mouse', () => {
        const rotar = new RotarConClicDerecho();
        const derecho = evento(2);
        expect(rotar.handleDownEvent(derecho.e)).toBe(true);
        expect(derecho.view.beginInteraction).toHaveBeenCalled();
        expect(rotar.handleDownEvent(evento(0).e)).toBe(false);
        expect(rotar.handleDownEvent(evento(2, 'touch').e)).toBe(false);
    });
});

const mapaFalso = () => {
    const destino = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const interacciones = new Set();
    return {
        addInteraction: vi.fn(i => interacciones.add(i)),
        removeInteraction: vi.fn(i => interacciones.delete(i)),
        getTargetElement: () => destino,
        interacciones,
        destino,
    };
};

describe('useRotacionClicDerecho', () => {
    afterEach(() => vi.restoreAllMocks());

    it('monta la rotacion en los dos panes del comparador', () => {
        const alfa = mapaFalso();
        const beta = mapaFalso();
        const mapas = [alfa, beta];
        renderHook(() => useRotacionClicDerecho(mapas, true));
        expect(alfa.interacciones.size).toBe(1);
        expect(beta.interacciones.size).toBe(1);
        expect(beta.destino.addEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('pasa de uno a dos mapas sin que React se queje del arreglo de dependencias', () => {
        const errores = vi.spyOn(console, 'error').mockImplementation(() => {});
        const alfa = mapaFalso();
        const beta = mapaFalso();
        const { rerender } = renderHook(({ mapas }) => useRotacionClicDerecho(mapas, true), {
            initialProps: { mapas: [alfa] },
        });
        rerender({ mapas: [alfa, beta] });
        const cambioDeTamano = errores.mock.calls.some(llamada => String(llamada[0]).includes('changed size between renders'));
        expect(cambioDeTamano).toBe(false);
        expect(beta.interacciones.size).toBe(1);
    });

    it('no vuelve a montar la interaccion si la lista llega con la misma identidad', () => {
        const mapa = mapaFalso();
        const mapas = [mapa];
        const { rerender } = renderHook(({ lista }) => useRotacionClicDerecho(lista, true), {
            initialProps: { lista: mapas },
        });
        rerender({ lista: mapas });
        expect(mapa.addInteraction).toHaveBeenCalledTimes(1);
    });

    it('quita las interacciones al desmontar', () => {
        const alfa = mapaFalso();
        const beta = mapaFalso();
        const mapas = [alfa, beta];
        const { unmount } = renderHook(() => useRotacionClicDerecho(mapas, true));
        unmount();
        expect(alfa.interacciones.size).toBe(0);
        expect(beta.interacciones.size).toBe(0);
    });

    it('no suprime el menu contextual cuando esta deshabilitada', () => {
        const mapa = mapaFalso();
        const mapas = [mapa];
        renderHook(() => useRotacionClicDerecho(mapas, false));
        expect(mapa.destino.addEventListener).not.toHaveBeenCalled();
    });
});
