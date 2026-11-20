import { describe, it, expect } from 'vitest';
import { areaMultipoligono, compacto, crearLinea, repartir, sumarLado } from '@pages/maps/helpers/repartoBarra';

const cuadro = (x0, y0, x1, y1) => [[[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]];

const municipio = (clave, nombre, coords) => {
    const puntos = coords.flat(2);
    return {
        clave,
        nombre,
        coords,
        area: areaMultipoligono(coords),
        extension: [
            Math.min(...puntos.map(p => p[0])), Math.min(...puntos.map(p => p[1])),
            Math.max(...puntos.map(p => p[0])), Math.max(...puntos.map(p => p[1])),
        ],
    };
};

const MUNICIPIOS = [
    municipio('14001', 'Oeste', cuadro(0, 0, 10, 10)),
    municipio('14002', 'Partido', cuadro(10, 0, 30, 10)),
    municipio('14003', 'Este', cuadro(30, 0, 40, 10)),
];

const barraEn = (x) => crearLinea([x, 100], [x, -100], [-1000, 0]);

describe('repartir', () => {
    it('asigna completos a los que no toca la barra y parte por área al resto', () => {
        const { asignados, partidos } = repartir(MUNICIPIOS, barraEn(16));
        expect(asignados.get('Oeste')).toEqual({ lado: 'A', partido: false });
        expect(asignados.get('Partido')).toEqual({ lado: 'B', partido: true });
        expect(asignados.get('Este')).toEqual({ lado: 'B', partido: false });
        expect(partidos).toBe(1);
    });

    it('el municipio partido se va al lado con más área', () => {
        expect(repartir(MUNICIPIOS, barraEn(24)).asignados.get('Partido').lado).toBe('A');
    });

    it('la barra horizontal reparte arriba y abajo', () => {
        const horizontal = crearLinea([-100, 4], [100, 4], [0, 1000]);
        const { asignados } = repartir(MUNICIPIOS, horizontal);
        expect([...new Set(MUNICIPIOS.map(m => asignados.get(m.nombre).lado))]).toEqual(['A']);
    });

    it('registra el municipio por nombre y por las formas de su clave', () => {
        const { asignados } = repartir(MUNICIPIOS, barraEn(16));
        expect(asignados.get('14001')).toBe(asignados.get('Oeste'));
        expect(asignados.get('001')).toBe(asignados.get('Oeste'));
        expect(asignados.get('1')).toBe(asignados.get('Oeste'));
    });
});

describe('sumarLado', () => {
    const ranking = {
        slots: [{ nombre: 'Población', op: 'sum' }, { nombre: 'Promedio', op: 'avg' }],
        municipios: [
            { llave: 'Oeste', valores: [100, 7] },
            { llave: 'Partido', valores: [50, 7] },
            { llave: 'Este', valores: [25, 7] },
        ],
    };

    it('suma solo lo sumable de los municipios del lado', () => {
        const reparto = repartir(MUNICIPIOS, barraEn(16));
        expect(sumarLado(ranking, reparto, 'A')).toEqual({ valores: [100, null], municipios: 1, cortados: 0 });
        expect(sumarLado(ranking, reparto, 'B')).toEqual({ valores: [75, null], municipios: 2, cortados: 1 });
    });

    it('respeta el filtro de municipios', () => {
        const reparto = repartir(MUNICIPIOS, barraEn(16));
        expect(sumarLado(ranking, reparto, 'B', new Set(['Este']))).toEqual({ valores: [25, null], municipios: 1, cortados: 0 });
    });

    it('pondera el promedio de cada municipio por sus registros', () => {
        const reparto = repartir(MUNICIPIOS, barraEn(16));
        const conPesos = {
            slots: [{ nombre: 'Escuelas', op: 'count' }, { nombre: 'Alumnos promedio', op: 'avg' }],
            municipios: [
                { llave: 'Partido', valores: [10, 200], pesos: [null, 10] },
                { llave: 'Este', valores: [30, 100], pesos: [null, 30] },
            ],
        };
        expect(sumarLado(conPesos, reparto, 'B').valores).toEqual([40, 125]);
    });

    it('sin ranking o sin reparto no hay suma', () => {
        expect(sumarLado(null, {}, 'A')).toBeNull();
        expect(sumarLado(ranking, null, 'A')).toBeNull();
    });
});

describe('compacto', () => {
    it('resume millones y miles', () => {
        expect(compacto(3412880)).toBe('3.4M');
        expect(compacto(84210)).toBe('84K');
        expect(compacto(2500)).toBe('2.5K');
        expect(compacto(12.345)).toBe('12.35');
        expect(compacto(null)).toBe('—');
    });
});
