import { describe, it, expect } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import { containsExtent } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { SELECCION_TODAS, anchoParaSeleccion, crearMascara, extentDeSeleccion, geometriaDeSeleccion, seleccionesDisponibles, trazosDeSeleccion } from '@pages/maps/components/MapExport/utils/seleccionDescarga';

const cuadro = (x, y, lado = 1000) => new Polygon([[[x, y], [x + lado, y], [x + lado, y + lado], [x, y + lado], [x, y]]]);

describe('seleccionesDisponibles', () => {
    it('numera los polígonos visibles en el orden en que se dibujaron', () => {
        const disponibles = seleccionesDisponibles([
            { id: 'a', type: 'Polygon', geometry: cuadro(0, 0), visible: true, feature: 'fa' },
            { id: 'b', type: 'LineString', geometry: new LineString([[0, 0], [1, 1]]), visible: true },
            { id: 'c', type: 'Select', geometry: cuadro(5000, 5000), visible: false },
            { id: 'd', type: 'Select', geometry: cuadro(9000, 9000), visible: true, feature: 'fd' },
        ]);
        expect(disponibles.map(d => [d.id, d.numero, d.feature])).toEqual([['a', 1, 'fa'], ['d', 2, 'fd']]);
        expect(seleccionesDisponibles(undefined)).toEqual([]);
    });
});

describe('geometriaDeSeleccion', () => {
    const disponibles = [
        { id: 'a', numero: 1, geometry: cuadro(0, 0), feature: 'fa' },
        { id: 'b', numero: 2, geometry: cuadro(5000, 5000), feature: 'fb' },
    ];

    it('sin elección toma el último, como antes', () => {
        expect(geometriaDeSeleccion(disponibles, null)).toBe(disponibles[1].geometry);
        expect(trazosDeSeleccion(disponibles, null)).toEqual(['fb']);
    });

    it('respeta el polígono elegido', () => {
        expect(geometriaDeSeleccion(disponibles, 'a')).toBe(disponibles[0].geometry);
    });

    it('Todos junta los polígonos en uno solo y oculta todos los trazos', () => {
        const junta = geometriaDeSeleccion(disponibles, SELECCION_TODAS);
        expect(junta.getType()).toBe('MultiPolygon');
        expect(junta.getPolygons()).toHaveLength(2);
        expect(trazosDeSeleccion(disponibles, SELECCION_TODAS)).toEqual(['fa', 'fb']);
    });

    it('sin polígonos no hay selección', () => {
        expect(geometriaDeSeleccion([], null)).toBeNull();
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

describe('anchoParaSeleccion', () => {
    const calidad = { mapWidth: 2007, mapHeight: 1700 };

    it('ajusta el ancho a la proporción del polígono y deja el alto', () => {
        const ancho = new Polygon([[[0, 0], [1500, 0], [1500, 1000], [0, 1000], [0, 0]]]);
        expect(anchoParaSeleccion(ancho, calidad)).toBe(2550);
    });

    it('no deja que un polígono muy delgado deforme la imagen', () => {
        const delgado = new Polygon([[[0, 0], [100, 0], [100, 1000], [0, 1000], [0, 0]]]);
        const larguisimo = new Polygon([[[0, 0], [10000, 0], [10000, 100], [0, 100], [0, 0]]]);
        expect(anchoParaSeleccion(delgado, calidad)).toBe(1020);
        expect(anchoParaSeleccion(larguisimo, calidad)).toBe(3740);
    });
});

describe('crearMascara con varios polígonos', () => {
    it('deja un hueco por cada polígono', () => {
        const junta = geometriaDeSeleccion([
            { id: 'a', geometry: cuadro(0, 0) },
            { id: 'b', geometry: cuadro(5000, 5000) },
        ], SELECCION_TODAS);
        const mascara = crearMascara(junta);
        expect(mascara.getCoordinates()).toHaveLength(3);
        expect(mascara.intersectsCoordinate([500, 500])).toBe(false);
        expect(mascara.intersectsCoordinate([5500, 5500])).toBe(false);
        expect(mascara.intersectsCoordinate([3000, 3000])).toBe(true);
    });
});

describe('Todos con polígonos encimados', () => {
    const encimados = [
        { id: 'a', geometry: cuadro(0, 0, 2000) },
        { id: 'b', geometry: cuadro(1000, 1000, 2000) },
    ];

    it('los une: un solo polígono con menos área que la suma', () => {
        const union = geometriaDeSeleccion(encimados, SELECCION_TODAS);
        expect(union.getType()).toBe('Polygon');
        expect(union.getArea()).toBe(7_000_000);
    });

    it('la zona compartida no queda tapada por la máscara', () => {
        const mascara = crearMascara(geometriaDeSeleccion(encimados, SELECCION_TODAS));
        expect(mascara.intersectsCoordinate([1500, 1500])).toBe(false);
        expect(mascara.intersectsCoordinate([500, 500])).toBe(false);
        expect(mascara.intersectsCoordinate([2500, 2500])).toBe(false);
        expect(mascara.intersectsCoordinate([3500, 500])).toBe(true);
    });
});

describe('Todos cuando los polígonos rodean una zona', () => {
    it('tapa el hueco que queda en medio', () => {
        const marco = [
            { id: 'abajo', geometry: cuadro(0, 0, 3000).clone() },
        ];
        const anillo = new Polygon([
            [[0, 0], [3000, 0], [3000, 3000], [0, 3000], [0, 0]],
            [[1000, 1000], [1000, 2000], [2000, 2000], [2000, 1000], [1000, 1000]],
        ]);
        marco[0].geometry = anillo;
        const mascara = crearMascara(geometriaDeSeleccion([...marco, { id: 'lejos', geometry: cuadro(9000, 9000) }], SELECCION_TODAS));
        expect(mascara.intersectsCoordinate([1500, 1500])).toBe(true);
        expect(mascara.intersectsCoordinate([500, 500])).toBe(false);
    });
});
