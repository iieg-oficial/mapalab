import { describe, expect, it } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import {
    ZOOM_CERCA, aPixel, dePixel, municipioEn, resolucionDeZoom, sigueVisible, vistaDelMinimapa,
} from '@pages/maps/helpers/minimapa';

const JALISCO = [-11766000, 2148000, -11295000, 2600000];

describe('minimapa', () => {
    it('aparece al pasar de 10 y no se esconde hasta bajar de 9.6', () => {
        expect(sigueVisible(false, 9.9)).toBe(false);
        expect(sigueVisible(false, 10)).toBe(true);
        expect(sigueVisible(true, 9.7)).toBe(true);
        expect(sigueVisible(true, 9.5)).toBe(false);
        expect(sigueVisible(true, undefined)).toBe(false);
    });

    it('con zoom medio encuadra todo Jalisco y con zoom alto sigue la vista cuatro niveles atrás', () => {
        const estado = vistaDelMinimapa({ centro: [0, 0], zoom: 11, extensionEstado: JALISCO, lado: 176 });
        expect(estado.modo).toBe('estado');
        expect(estado.centro).toEqual([(JALISCO[0] + JALISCO[2]) / 2, (JALISCO[1] + JALISCO[3]) / 2]);
        const cerca = vistaDelMinimapa({ centro: [5, 7], zoom: ZOOM_CERCA + 1, extensionEstado: JALISCO, lado: 176 });
        expect(cerca).toEqual({ modo: 'cerca', centro: [5, 7], resolucion: resolucionDeZoom(ZOOM_CERCA - 3) });
    });

    it('de cerca no se acerca tanto que el municipio deje de caber con su borde', () => {
        const municipio = [-11520000, 2380000, -11480000, 2420000];
        const centro = [-11500000, 2400000];
        const vista = vistaDelMinimapa({ centro, zoom: 16, extensionEstado: JALISCO, extensionMunicipio: municipio, lado: 176 });
        expect(vista.modo).toBe('cerca');
        expect(vista.resolucion).toBeGreaterThan(resolucionDeZoom(12));
        const [x0, y0] = aPixel(vista, 176, [municipio[0], municipio[3]]);
        const [x1, y1] = aPixel(vista, 176, [municipio[2], municipio[1]]);
        expect(Math.min(x0, y0)).toBeGreaterThanOrEqual(0);
        expect(Math.max(x1, y1)).toBeLessThanOrEqual(176);
    });

    it('si el municipio ya cabe, se queda cuatro niveles atrás de la vista', () => {
        const chico = [-11500500, 2399500, -11499500, 2400500];
        const vista = vistaDelMinimapa({ centro: [-11500000, 2400000], zoom: 14, extensionEstado: JALISCO, extensionMunicipio: chico, lado: 176 });
        expect(vista.resolucion).toBe(resolucionDeZoom(10));
    });

    it('convierte de ida y vuelta entre coordenadas y pixeles del lienzo', () => {
        const vista = { centro: [-11500000, 2400000], resolucion: 2500 };
        const punto = [-11480000, 2410000];
        const [px, py] = aPixel(vista, 176, punto);
        expect(px).toBeGreaterThan(88);
        expect(py).toBeLessThan(88);
        const [x, y] = dePixel(vista, 176, [px, py]);
        expect(x).toBeCloseTo(punto[0]);
        expect(y).toBeCloseTo(punto[1]);
    });

    it('nombra el municipio que contiene el centro de la vista', () => {
        const cuadro = new Polygon([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]);
        const municipios = [{ clave: '039', nombre: 'Guadalajara', geometry: cuadro }];
        expect(municipioEn(municipios, [5, 5])?.nombre).toBe('Guadalajara');
        expect(municipioEn(municipios, [50, 5])).toBeNull();
        expect(municipioEn(null, [5, 5])).toBeNull();
    });
});
