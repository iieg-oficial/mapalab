import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ ctx: null, en3d: false, track: vi.fn() }));

vi.mock('@hooks/useMaps', () => ({ useMapsContext: () => mocks.ctx }));
vi.mock('@contexts/View3dContext', () => ({ useView3d: () => ({ active: mocks.en3d }) }));
vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@services/analyticsService', () => ({ trackMinimapa: mocks.track }));
vi.mock('@services/municipioService', async () => {
    const { default: Polygon } = await import('ol/geom/Polygon');
    const zapopan = new Polygon([[[-11520000, 2380000], [-11480000, 2380000], [-11480000, 2420000], [-11520000, 2420000], [-11520000, 2380000]]]);
    return { fetchSiluetas: () => Promise.resolve({ estado: null, municipios: [{ clave: '120', nombre: 'Zapopan', geometry: zapopan }] }) };
});

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
    const lienzoDelMapa = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1024, height: 768 }) };
    return { animate, map: { getView: () => vista, getSize: () => [1024, 768], getTargetElement: () => lienzoDelMapa, on: vi.fn(), un: vi.fn() } };
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

    it('en modo municipio marca con un punto discreto el centro que elige el municipio', async () => {
        montar(MinimapaEscritorio, 13);
        await act(async () => {});
        const punto = document.querySelector('[data-punto-minimapa]');
        expect(punto).not.toBeNull();
        expect(punto.style.left).toBe('512px');
        expect(punto.style.top).toBe('384px');
    });

    it('fuera del modo municipio no hay punto', async () => {
        montar(MinimapaEscritorio, 11);
        await act(async () => {});
        expect(document.querySelector('[data-punto-minimapa]')).toBeNull();
    });
});
