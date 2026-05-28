import { describe, it, expect, vi } from 'vitest';
import {
    expandExtent,
    extentToRing,
    extractHoleRings,
    unionGeometriesExtent,
    buildMaskPolygon,
} from '@pages/maps/helpers/municipioMask';

vi.mock('ol/geom', () => ({
    Polygon: class MockPolygon {
        constructor(rings) {
            this.rings = rings;
            this.type = 'Polygon';
        }
    },
}));

const mockPolygonGeom = (coords) => ({
    getType: () => 'Polygon',
    getLinearRing: (idx) => (idx === 0 ? { getCoordinates: () => coords } : null),
    getExtent: () => {
        const xs = coords.map(c => c[0]);
        const ys = coords.map(c => c[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    },
});

const mockMultiPolygonGeom = (polysCoords) => ({
    getType: () => 'MultiPolygon',
    getPolygons: () => polysCoords.map(coords => ({
        getLinearRing: (idx) => (idx === 0 ? { getCoordinates: () => coords } : null),
    })),
    getExtent: () => {
        const all = polysCoords.flat();
        const xs = all.map(c => c[0]);
        const ys = all.map(c => c[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    },
});

describe('municipioMask helpers', () => {
    describe('expandExtent', () => {
        it('expande el extent por el factor dado', () => {
            expect(expandExtent([0, 0, 100, 100], 0.5)).toEqual([-50, -50, 150, 150]);
            expect(expandExtent([10, 20, 30, 40], 1)).toEqual([-10, 0, 50, 60]);
        });

        it('retorna null para extents inválidos', () => {
            expect(expandExtent(null)).toBeNull();
            expect(expandExtent([1, 2])).toBeNull();
            expect(expandExtent(undefined)).toBeNull();
        });
    });

    describe('extentToRing', () => {
        it('genera un anillo cerrado de 5 coordenadas en sentido horario', () => {
            const ring = extentToRing([0, 0, 10, 10]);
            expect(ring).toHaveLength(5);
            expect(ring[0]).toEqual(ring[4]);
            expect(ring).toEqual([
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0],
            ]);
        });

        it('retorna null para extents inválidos', () => {
            expect(extentToRing(null)).toBeNull();
            expect(extentToRing([1, 2, 3])).toBeNull();
        });
    });

    describe('extractHoleRings', () => {
        it('extrae el outer ring de un Polygon', () => {
            const geom = mockPolygonGeom([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);
            expect(extractHoleRings(geom)).toEqual([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]);
        });

        it('extrae el outer ring de cada parte de un MultiPolygon', () => {
            const geom = mockMultiPolygonGeom([
                [[0, 0], [1, 0], [1, 1], [0, 0]],
                [[5, 5], [6, 5], [6, 6], [5, 5]],
            ]);
            expect(extractHoleRings(geom)).toHaveLength(2);
            expect(extractHoleRings(geom)[0]).toEqual([[0, 0], [1, 0], [1, 1], [0, 0]]);
        });

        it('retorna array vacío para geometrías nulas o tipos desconocidos', () => {
            expect(extractHoleRings(null)).toEqual([]);
            expect(extractHoleRings({ getType: () => 'Point' })).toEqual([]);
        });
    });

    describe('unionGeometriesExtent', () => {
        it('calcula el extent unión de varias geometrías', () => {
            const a = mockPolygonGeom([[0, 0], [10, 10]]);
            const b = mockPolygonGeom([[20, -5], [30, 5]]);
            expect(unionGeometriesExtent([a, b])).toEqual([0, -5, 30, 10]);
        });

        it('retorna null para arrays vacíos o nulos', () => {
            expect(unionGeometriesExtent([])).toBeNull();
            expect(unionGeometriesExtent(null)).toBeNull();
        });

        it('ignora geometrías sin getExtent', () => {
            const valid = mockPolygonGeom([[0, 0], [5, 5]]);
            expect(unionGeometriesExtent([{ foo: 'bar' }, valid])).toEqual([0, 0, 5, 5]);
        });
    });

    describe('buildMaskPolygon', () => {
        it('construye un Polygon con outer expandido y holes de cada municipio', () => {
            const muni = mockPolygonGeom([[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]);
            const poly = buildMaskPolygon([0, 0, 10, 10], [muni], 0.5);
            expect(poly.rings).toHaveLength(2);
            expect(poly.rings[0]).toEqual([
                [-5, -5],
                [15, -5],
                [15, 15],
                [-5, 15],
                [-5, -5],
            ]);
            expect(poly.rings[1]).toEqual([[2, 2], [3, 2], [3, 3], [2, 3], [2, 2]]);
        });

        it('retorna null si el extent es inválido', () => {
            expect(buildMaskPolygon(null, [])).toBeNull();
        });

        it('funciona sin holes (solo outer ring)', () => {
            const poly = buildMaskPolygon([0, 0, 10, 10], []);
            expect(poly.rings).toHaveLength(1);
        });
    });
});
