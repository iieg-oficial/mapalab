import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';

const mocks = vi.hoisted(() => ({ ctx: null, webgl: true }));

vi.mock('@hooks/useMaps', () => ({ useMapsContext: () => mocks.ctx }));
vi.mock('@services/analyticsService', () => ({ trackView3d: vi.fn() }));
vi.mock('@pages/maps/helpers/view3d', async (importOriginal) => ({
    ...(await importOriginal()),
    webglAvailable: () => mocks.webgl,
}));

import { View3dProvider, useView3d } from '@contexts/View3dContext';
import { pedirVista3d, tomarVista3d } from '@pages/maps/helpers/vista3dCompartida';

const makeCtx = (overrides = {}) => ({
    compareMode: { active: false },
    exitCompareMode: vi.fn(),
    hideMeasurementTools: vi.fn(),
    hideAnnotationTools: vi.fn(),
    setSelectedFeatureInfo: vi.fn(),
    activeLayerIds: ['poblacion', 'hexbin'],
    ...overrides,
});

const render = (entry = '/mapa') => renderHook(() => ({ view: useView3d(), location: useLocation() }), {
    wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[entry]}>
            <View3dProvider>{children}</View3dProvider>
        </MemoryRouter>
    ),
});

const params = (result) => new URLSearchParams(result.current.location.search);

describe('View3dContext', () => {
    beforeEach(() => {
        mocks.ctx = makeCtx();
        mocks.webgl = true;
    });

    it('arranca en 3D con la inclinacion y las capas levantadas de la URL', () => {
        const { result } = render('/mapa?layers=poblacion&vista=3d&inclinacion=40&extruir=poblacion');
        expect(result.current.view.active).toBe(true);
        expect(result.current.view.pitch).toBe(40);
        expect(result.current.view.extruded).toEqual(['poblacion']);
        expect(params(result).get('layers')).toBe('poblacion');
    });

    it('al entrar conserva el comparador, cierra herramientas y escribe la vista en la URL', () => {
        mocks.ctx = makeCtx({ compareMode: { active: true } });
        const { result } = render();
        act(() => { result.current.view.enter(); });
        expect(result.current.view.active).toBe(true);
        expect(mocks.ctx.exitCompareMode).not.toHaveBeenCalled();
        expect(mocks.ctx.hideMeasurementTools).toHaveBeenCalled();
        expect(mocks.ctx.hideAnnotationTools).toHaveBeenCalled();
        expect(mocks.ctx.setSelectedFeatureInfo).toHaveBeenCalledWith(null);
        expect(params(result).get('vista')).toBe('3d');
    });

    it('al salir limpia los parametros de la vista 3D', () => {
        const { result } = render('/mapa?vista=3d&inclinacion=30&extruir=poblacion&layers=poblacion');
        act(() => { result.current.view.exit(); });
        expect(result.current.view.active).toBe(false);
        expect(params(result).has('vista')).toBe(false);
        expect(params(result).has('extruir')).toBe(false);
        expect(params(result).get('layers')).toBe('poblacion');
    });

    it('levanta y aplana capas y lo refleja en la URL', () => {
        const { result } = render('/mapa?vista=3d');
        act(() => { result.current.view.toggleExtrusion('poblacion'); });
        expect(result.current.view.isExtruded('poblacion')).toBe(true);
        expect(params(result).get('extruir')).toBe('poblacion');
        act(() => { result.current.view.toggleExtrusion('poblacion'); });
        expect(result.current.view.extruded).toEqual([]);
    });

    it('suelta la extrusion de una capa que se desactiva', () => {
        const { result, rerender } = render('/mapa?vista=3d&extruir=poblacion,hexbin');
        mocks.ctx = makeCtx({ activeLayerIds: ['hexbin'] });
        rerender();
        expect(result.current.view.extruded).toEqual(['hexbin']);
    });

    it('conserva las capas de la URL mientras todavia no cargan', () => {
        mocks.ctx = makeCtx({ activeLayerIds: [] });
        const { result, rerender } = render('/mapa?vista=3d&extruir=poblacion');
        mocks.ctx = makeCtx({ activeLayerIds: ['poblacion'] });
        rerender();
        expect(result.current.view.extruded).toEqual(['poblacion']);
    });

    it('sigue en 3D si se abre el comparador', () => {
        const { result, rerender } = render('/mapa?vista=3d');
        mocks.ctx = makeCtx({ compareMode: { active: true } });
        rerender();
        expect(result.current.view.active).toBe(true);
        expect(params(result).get('vista')).toBe('3d');
    });

    it('sin WebGL no entra, pero el control sigue presente para poder explicarlo', () => {
        mocks.webgl = false;
        const { result } = render('/mapa?vista=3d');
        expect(result.current.view.present).toBe(true);
        expect(result.current.view.available).toBe(false);
        expect(result.current.view.active).toBe(false);
        let entered = true;
        act(() => { entered = result.current.view.enter(); });
        expect(entered).toBe(false);
    });

    it('fuera del proveedor responde inactivo', () => {
        const { result } = renderHook(() => useView3d());
        expect(result.current.present).toBe(false);
        expect(result.current.active).toBe(false);
        expect(result.current.available).toBe(false);
        expect(result.current.enter()).toBe(false);
    });

    it('restablecer regresa los ajustes y los interruptores a sus valores por defecto', () => {
        const { result } = render('/mapa?vista=3d&inclinacion=20');
        act(() => {
            result.current.view.setExaggeration(4);
            result.current.view.setSol(90);
            result.current.view.setTerreno(false);
            result.current.view.setNiebla(false);
            result.current.view.setOrbita(true);
            result.current.view.setEstiloPuntos('poste');
        });
        act(() => result.current.view.restablecer());
        expect(result.current.view).toMatchObject({ pitch: 55, exaggeration: 1.5, sol: 315, terreno: true, cielo: true, niebla: true, orbita: false, estiloPuntos: 'sombra' });
    });
    it('un enlace compartido en 3D entra con su camara y sus capas levantadas', () => {
        const { result } = render();
        act(() => { pedirVista3d({ pitch: 62, bearing: -40, exaggeration: 2.5, extruded: ['poblacion'] }); });
        expect(result.current.view.active).toBe(true);
        expect(result.current.view.pitch).toBe(62);
        expect(result.current.view.bearing).toBe(-40);
        expect(result.current.view.exaggeration).toBe(2.5);
        expect(result.current.view.extruded).toEqual(['poblacion']);
        expect(params(result).get('inclinacion')).toBe('62');
    });

    it('sin WebGL el enlace en 3D abre en 2D', () => {
        mocks.webgl = false;
        const { result } = render();
        act(() => { pedirVista3d({ pitch: 62, bearing: 0, exaggeration: 1.5, extruded: [] }); });
        expect(result.current.view.active).toBe(false);
        expect(tomarVista3d()).toBeNull();
    });
});
