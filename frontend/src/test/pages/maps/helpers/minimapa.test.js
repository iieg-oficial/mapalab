import { describe, expect, it } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import {
    ZOOM_CERCA, aPixel, dePixel, municipioEn, resolucionDeZoom, sigueVisible, ubicarMinimapa, vistaDelMinimapa,
} from '@pages/maps/helpers/minimapa';

const caja = (left, top, right, bottom) => ({ left, top, right, bottom });
const JALISCO = [-11766000, 2148000, -11295000, 2600000];

describe('minimapa', () => {
    it('aparece al pasar de 10 y no se esconde hasta bajar de 9.6', () => {
        expect(sigueVisible(false, 9.9)).toBe(false);
        expect(sigueVisible(false, 10)).toBe(true);
        expect(sigueVisible(true, 9.7)).toBe(true);
        expect(sigueVisible(true, 9.5)).toBe(false);
        expect(sigueVisible(true, undefined)).toBe(false);
    });

    it('sin obstáculos va en la esquina y no aparece en pantallas chicas', () => {
        expect(ubicarMinimapa({ ancho: 1920, alto: 950 })).toEqual({ abajo: 16, derecha: 16 });
        expect(ubicarMinimapa({ ancho: 390, alto: 760 })).toBeNull();
        expect(ubicarMinimapa({ ancho: 1366, alto: 540 })).toBeNull();
    });

    it('sube por encima de la atribución y de la numeralia', () => {
        const atribucion = caja(1180, 910, 1904, 942);
        const numeralia = caja(400, 700, 1904, 886);
        expect(ubicarMinimapa({ ancho: 1920, alto: 950, cajas: [atribucion] })).toEqual({ abajo: 52, derecha: 16 });
        expect(ubicarMinimapa({ ancho: 1920, alto: 950, cajas: [atribucion, numeralia] })).toEqual({ abajo: 262, derecha: 16 });
    });

    it('si arriba no cabe, se corre a la izquierda del panel de capas', () => {
        const capas = caja(1051, 108, 1350, 600);
        const atribucion = caja(1180, 610, 1350, 642);
        expect(ubicarMinimapa({ ancho: 1366, alto: 650, cajas: [capas, atribucion] })).toEqual({ abajo: 16, derecha: 327 });
    });

    it('si tampoco cabe a la izquierda, se esconde', () => {
        const franja = caja(0, 150, 1366, 650);
        expect(ubicarMinimapa({ ancho: 1366, alto: 650, cajas: [franja] })).toBeNull();
    });

    it('con zoom medio encuadra todo Jalisco y con zoom alto sigue la vista cuatro niveles atrás', () => {
        const estado = vistaDelMinimapa({ centro: [0, 0], zoom: 11, extensionEstado: JALISCO, lado: 176 });
        expect(estado.modo).toBe('estado');
        expect(estado.centro).toEqual([(JALISCO[0] + JALISCO[2]) / 2, (JALISCO[1] + JALISCO[3]) / 2]);
        const cerca = vistaDelMinimapa({ centro: [5, 7], zoom: ZOOM_CERCA + 1, extensionEstado: JALISCO, lado: 176 });
        expect(cerca).toEqual({ modo: 'cerca', centro: [5, 7], resolucion: resolucionDeZoom(ZOOM_CERCA - 3) });
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
