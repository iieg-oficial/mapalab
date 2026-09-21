import { describe, it, expect } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import { containsExtent } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { crearMascara, extentDeSeleccion, ultimaSeleccion } from '@pages/maps/components/MapExport/utils/seleccionDescarga';

const cuadro = (x, y, lado = 1000) => new Polygon([[[x, y], [x + lado, y], [x + lado, y + lado], [x, y + lado], [x, y]]]);

describe('ultimaSeleccion', () => {
    it('toma el último polígono visible, sea Polygon o Select', () => {
        const primero = cuadro(0, 0);
        const ultimo = cuadro(5000, 5000);
        expect(ultimaSeleccion([
            { type: 'Polygon', geometry: primero, visible: true },
            { type: 'Select', geometry: ultimo, visible: true },
            { type: 'LineString', geometry: new LineString([[0, 0], [1, 1]]), visible: true },
        ])).toBe(ultimo);
    });

    it('ignora los ocultos y regresa null si no hay polígonos', () => {
        expect(ultimaSeleccion([{ type: 'Polygon', geometry: cuadro(0, 0), visible: false }])).toBeNull();
        expect(ultimaSeleccion([])).toBeNull();
        expect(ultimaSeleccion(undefined)).toBeNull();
    });
});

describe('extentDeSeleccion', () => {
    it('encuadra el polígono completo, con margen', () => {
        const poligono = cuadro(-11500000, 2350000, 20000);
        const extent3857 = transformExtent(extentDeSeleccion(poligono), 'EPSG:4326', 'EPSG:3857');
        expect(containsExtent(extent3857, poligono.getExtent())).toBe(true);
        expect(extent3857[2] - extent3857[0]).toBeGreaterThan(20000);
    });
});

describe('crearMascara', () => {
    it('cubre el mundo y deja el polígono como hueco', () => {
        const poligono = cuadro(0, 0);
        const mascara = crearMascara(poligono);
        const anillos = mascara.getCoordinates();
        expect(anillos).toHaveLength(2);
        expect(anillos[1]).toEqual(poligono.getCoordinates()[0]);
        expect(mascara.intersectsCoordinate([500, 500])).toBe(false);
        expect(mascara.intersectsCoordinate([50000, 50000])).toBe(true);
    });
});
