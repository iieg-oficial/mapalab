import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ ctx: null, en3d: false, movil: false, track: vi.fn() }));

vi.mock('@hooks/useMaps', () => ({ useMapsContext: () => mocks.ctx }));
vi.mock('@hooks/useIsMobile', () => ({ useIsMobile: () => mocks.movil }));
vi.mock('@contexts/View3dContext', () => ({ useView3d: () => ({ active: mocks.en3d }) }));
vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@services/analyticsService', () => ({ trackMinimapa: mocks.track }));
vi.mock('@services/municipioService', () => ({ fetchSiluetas: () => Promise.resolve({ estado: null, municipios: [] }) }));

import Minimapa from '@pages/maps/components/Minimapa/Minimapa';
import MinimapaEscritorio from '@pages/maps/components/Minimapa/MinimapaEscritorio';
import { fijarMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';

const mapaFalso = (zoom) => {
    const animate = vi.fn();
    const vista = {
        getCenter: () => [-11500000, 2400000],
        getZoom: () => zoom,
        calculateExtent: () => [-11510000, 2390000, -11490000, 2410000],
        animate,
    };
    return { animate, map: { getView: () => vista, getSize: () => [1024, 768], on: vi.fn(), un: vi.fn() } };
};

const montar = (Componente, zoom, extra = {}) => {
    const { map, animate } = mapaFalso(zoom);
    mocks.ctx = { mapRef: { current: map }, isDrawing: false, ...extra };
    render(<Componente />);
    return animate;
};

const lienzo = () => screen.queryByLabelText(/Minimapa de Jalisco/);
const tocar = (elemento) => {
    fireEvent.pointerDown(elemento, { clientX: 10, clientY: 10 });
    fireEvent.click(elemento, { clientX: 10, clientY: 10 });
};

describe('Minimapa', () => {
    beforeEach(() => {
        mocks.en3d = false;
        mocks.movil = false;
        mocks.track.mockClear();
        act(() => fijarMinimapaEncendido(true));
    });

    it('apagado no aparece aunque haya zoom', () => {
        act(() => fijarMinimapaEncendido(false));
        montar(MinimapaEscritorio, 12);
        expect(lienzo()).toBeNull();
    });

    it('con Jalisco casi entero se queda atenuado, en espera de que te acerques', () => {
        montar(MinimapaEscritorio, 8);
        expect(lienzo()).not.toBeNull();
        expect(document.querySelector('[data-minimapa]').dataset.atenuado).toBe('true');
    });

    it('al acercarse muestra el contorno sin píldora debajo, y un clic mueve el mapa', () => {
        const animate = montar(MinimapaEscritorio, 11);
        expect(screen.queryByText('Jalisco')).toBeNull();
        tocar(lienzo());
        expect(animate).toHaveBeenCalledWith(expect.objectContaining({ center: expect.any(Array) }));
        expect(mocks.track).toHaveBeenCalledWith('ir');
    });

    it('un arrastre que empieza encima no mueve el mapa', () => {
        const animate = montar(MinimapaEscritorio, 11);
        fireEvent.pointerDown(lienzo(), { clientX: 10, clientY: 10 });
        fireEvent.click(lienzo(), { clientX: 60, clientY: 40 });
        expect(animate).not.toHaveBeenCalled();
    });

    it('a media medición el clic no mueve el mapa', () => {
        const animate = montar(MinimapaEscritorio, 11, { isDrawing: true });
        tocar(lienzo());
        expect(animate).not.toHaveBeenCalled();
    });

    it('la × lo quita y se queda quitado', () => {
        montar(MinimapaEscritorio, 11);
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
        expect(lienzo()).toBeNull();
        expect(mocks.track).toHaveBeenCalledWith('apagar');
        expect(localStorage.getItem('mapalab.minimapa')).toBe('apagado');
    });

    it('en la vista 3D no se monta', () => {
        mocks.en3d = true;
        montar(MinimapaEscritorio, 12);
        expect(lienzo()).toBeNull();
    });

    it('en escritorio el montaje de Maps no dibuja nada: vive junto al zoom', () => {
        montar(Minimapa, 12);
        expect(lienzo()).toBeNull();
    });

    it('en celular es una píldora que abre el minimapa grande y lo cierra al moverse', () => {
        mocks.movil = true;
        const animate = montar(Minimapa, 11);
        expect(lienzo()).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /Ver dónde estás en Jalisco/ }));
        expect(mocks.track).toHaveBeenCalledWith('abrir');
        tocar(lienzo());
        expect(animate).toHaveBeenCalled();
        expect(lienzo()).toBeNull();
    });
});
