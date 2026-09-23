import { describe, it, expect } from 'vitest';
import {
    areaPlana,
    areaSobreRelieve,
    densificar,
    distanciaMetros,
    largoPlano,
    perfilDesde,
    perimetro,
    rejillaSobre,
} from '@pages/maps/helpers/medicion3d';
import { alturaDesdeRgba, pixelDe } from '@pages/maps/helpers/elevacionDem';
import { geometriaMedicion } from '@pages/maps/hooks/useMedicion3d';

const GUZMAN = [-103.4613, 19.7045];
const NEVADO = [-103.617, 19.563];

describe('distancias planas', () => {
    it('coincide con ol/sphere y crece con los vertices', () => {
        const directo = distanciaMetros(GUZMAN, NEVADO);
        expect(directo).toBeGreaterThan(22000);
        expect(directo).toBeLessThan(23500);
        expect(largoPlano([GUZMAN, NEVADO])).toBeCloseTo(directo, -2);
        expect(largoPlano([GUZMAN])).toBe(0);
    });

    it('area y perimetro de un cuadro de un kilometro aproximado', () => {
        const d = 0.009;
        const cuadro = [[-103, 20], [-103 + d, 20], [-103 + d, 20 + d], [-103, 20 + d]];
        expect(areaPlana(cuadro) / 1e6).toBeGreaterThan(0.9);
        expect(areaPlana(cuadro) / 1e6).toBeLessThan(1.1);
        expect(perimetro(cuadro) / 1000).toBeGreaterThan(3.7);
        expect(areaPlana(cuadro.slice(0, 2))).toBe(0);
    });
});

describe('densificar', () => {
    it('muestrea cada pocos metros y termina en el ultimo vertice', () => {
        const muestras = densificar([GUZMAN, NEVADO]);
        expect(muestras.length).toBeGreaterThan(100);
        expect(muestras[0].metros).toBe(0);
        expect(muestras.at(-1).lngLat).toEqual(NEVADO);
        expect(muestras.at(-1).metros).toBeCloseTo(distanciaMetros(GUZMAN, NEVADO), 0);
        expect(densificar([GUZMAN])).toEqual([]);
    });
});

describe('perfilDesde', () => {
    it('suma la pendiente, la subida y la bajada, e ignora los huecos', () => {
        const muestras = [0, 100, 200, 300].map(m => ({ metros: m, lngLat: [0, 0] }));
        const r = perfilDesde(muestras, [1000, 1100, null, 1050]);
        expect(r.perfil).toHaveLength(3);
        expect(r.sube).toBe(100);
        expect(r.baja).toBe(50);
        expect(r.max).toBe(1100);
        expect(r.min).toBe(1000);
        expect(r.superficie).toBeCloseTo(Math.hypot(100, 100) + Math.hypot(200, 50), 6);
    });
});

describe('areaSobreRelieve', () => {
    const d = 0.02;
    const cuadro = [[-103, 20], [-103 + d, 20], [-103 + d, 20 + d], [-103, 20 + d]];

    it('en terreno plano es igual al area vista desde arriba', () => {
        const rejilla = rejillaSobre(cuadro, 20);
        const plana = areaSobreRelieve(cuadro, rejilla, rejilla.nodos.map(() => 1500));
        expect(plana / areaPlana(cuadro)).toBeCloseTo(1, 1);
    });

    it('en una ladera es mayor', () => {
        const rejilla = rejillaSobre(cuadro, 20);
        const alturas = rejilla.nodos.map(([lng]) => 1500 + (lng + 103) * 111000);
        expect(areaSobreRelieve(cuadro, rejilla, alturas)).toBeGreaterThan(areaPlana(cuadro) * 1.3);
    });
});

describe('lectura del DEM', () => {
    it('ubica el pixel del tile a zoom 12', () => {
        const { tx, ty, px, py } = pixelDe(NEVADO, 12);
        expect(tx).toBe(869);
        expect(ty).toBe(1820);
        expect(px).toBeGreaterThanOrEqual(0);
        expect(py).toBeLessThan(256);
    });

    it('decodifica R*256+G y descarta transparentes', () => {
        const datos = new Uint8ClampedArray(256 * 256 * 4);
        datos.set([15, 80, 0, 255], 0);
        datos.set([0, 0, 0, 0], 4);
        expect(alturaDesdeRgba(datos, 0, 0)).toBe(3920);
        expect(alturaDesdeRgba(datos, 1, 0)).toBeNull();
    });
});

describe('geometriaMedicion', () => {
    it('dibuja la linea, cierra el poligono y agrega el marcador del perfil', () => {
        const v = [[0, 0], [1, 0], [1, 1]];
        const linea = geometriaMedicion({ modo: 'linea', vertices: v, marcador: [0.5, 0] });
        expect(linea.features.map(f => f.properties.rol)).toEqual(['traza', 'vertice', 'vertice', 'vertice', 'marcador']);
        const area = geometriaMedicion({ modo: 'poligono', vertices: v, marcador: null });
        expect(area.features[0].properties.rol).toBe('area');
        expect(area.features[0].geometry.coordinates[0].at(-1)).toEqual([0, 0]);
        expect(geometriaMedicion({ modo: 'punto', vertices: [[0, 0]], marcador: null }).features).toHaveLength(1);
    });
});
