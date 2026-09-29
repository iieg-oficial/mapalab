import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ ctx: null, en3d: false, movil: false, track: vi.fn() }));

vi.mock('@hooks/useMaps', () => ({ useMapsContext: () => mocks.ctx }));
vi.mock('@hooks/useIsMobile', () => ({ useIsMobile: () => mocks.movil }));
vi.mock('@contexts/View3dContext', () => ({ useView3d: () => ({ active: mocks.en3d }) }));
vi.mock('@contexts/AreaUtilContext', () => ({ useAreaUtil: () => ({ margenes: { left: 0, right: 0, top: 0, bottom: 0 } }) }));
vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@services/analyticsService', () => ({ trackMinimapa: mocks.track }));
vi.mock('@services/municipioService', () => ({ fetchSiluetas: () => Promise.resolve({ estado: null, municipios: [] }) }));

import Minimapa from '@pages/maps/components/Minimapa/Minimapa';
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

const montar = (zoom, extra = {}) => {
    const { map, animate } = mapaFalso(zoom);
    mocks.ctx = { mapRef: { current: map }, isDrawing: false, ...extra };
    render(<Minimapa />);
    return animate;
};

const lienzo = () => screen.queryByLabelText(/Minimapa de Jalisco/);

describe('Minimapa', () => {
    beforeEach(() => {
        mocks.en3d = false;
        mocks.movil = false;
        mocks.track.mockClear();
        act(() => fijarMinimapaEncendido(true));
    });

    it('no aparece mientras Jalisco se ve casi entero', () => {
        montar(8);
        expect(lienzo()).toBeNull();
    });

    it('aparece al acercarse y un clic mueve el mapa a ese punto', () => {
        const animate = montar(11);
        expect(lienzo()).not.toBeNull();
        fireEvent.click(lienzo(), { clientX: 10, clientY: 10 });
        expect(animate).toHaveBeenCalledWith(expect.objectContaining({ center: expect.any(Array) }));
        expect(mocks.track).toHaveBeenCalledWith('ir');
    });

    it('a media medición el clic no mueve el mapa', () => {
        const animate = montar(11, { isDrawing: true });
        fireEvent.click(lienzo(), { clientX: 10, clientY: 10 });
        expect(animate).not.toHaveBeenCalled();
    });

    it('la × lo quita y se queda quitado', () => {
        montar(11);
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
        expect(lienzo()).toBeNull();
        expect(mocks.track).toHaveBeenCalledWith('apagar');
        expect(localStorage.getItem('mapalab.minimapa')).toBe('apagado');
    });

    it('en la vista 3D no se monta', () => {
        mocks.en3d = true;
        montar(12);
        expect(lienzo()).toBeNull();
    });

    it('en celular es una píldora que abre el minimapa grande y lo cierra al moverse', () => {
        mocks.movil = true;
        const animate = montar(11);
        expect(lienzo()).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /Ver dónde estás en Jalisco/ }));
        expect(mocks.track).toHaveBeenCalledWith('abrir');
        fireEvent.click(lienzo(), { clientX: 10, clientY: 10 });
        expect(animate).toHaveBeenCalled();
        expect(lienzo()).toBeNull();
    });
});
