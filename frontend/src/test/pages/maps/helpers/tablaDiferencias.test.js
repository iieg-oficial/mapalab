import { describe, it, expect } from 'vitest';
import {
    elegirLlave,
    camposComparables,
    unirLados,
    ordenarPorDelta,
    soloLosQueCambiaron,
    TOPE_UNION,
} from '@pages/maps/helpers/tablaDiferencias';

const feature = (propiedades) => ({ type: 'Feature', properties: propiedades });

const ALFA = [
    feature({ clave_municipio: '14039', nombre: 'Guadalajara', temperatura: 21.4 }),
    feature({ clave_municipio: '14120', nombre: 'Zapopan', temperatura: 20.8 }),
    feature({ clave_municipio: '14063', nombre: 'Ocotlán', temperatura: 20.6 }),
    feature({ clave_municipio: '14008', nombre: 'Arandas', temperatura: 18.9 }),
];

const BETA = [
    feature({ clave_municipio: '14039', nombre: 'Guadalajara', temperatura: 23.1 }),
    feature({ clave_municipio: '14120', nombre: 'Zapopan', temperatura: 22.6 }),
    feature({ clave_municipio: '14063', nombre: 'Ocotlán', temperatura: 20.6 }),
    feature({ clave_municipio: '14023', nombre: 'Cuautitlán', temperatura: 24.7 }),
];

describe('elegirLlave', () => {
    it('prefiere clave_municipio sobre fid', () => {
        expect(elegirLlave(['fid', 'nombre', 'clave_municipio'])).toBe('clave_municipio');
    });

    it('cae a fid cuando no hay llave territorial', () => {
        expect(elegirLlave(['fid', 'nombre'])).toBe('fid');
    });

    it('devuelve null si la capa no trae ninguna llave del contrato', () => {
        expect(elegirLlave(['nombre', 'valor'])).toBeNull();
    });
});

describe('camposComparables', () => {
    it('solo ofrece columnas numéricas y nunca la llave', () => {
        expect(camposComparables(ALFA, 'clave_municipio')).toEqual(['temperatura']);
    });

    it('descarta una columna si algún registro la trae no numérica', () => {
        const mezcla = [feature({ fid: 1, valor: 3 }), feature({ fid: 2, valor: 'sin dato' })];
        expect(camposComparables(mezcla, 'fid')).toEqual([]);
    });
});

describe('unirLados', () => {
    const { filas, resumen } = unirLados({ alfa: ALFA, beta: BETA, llave: 'clave_municipio', campo: 'temperatura' });

    it('une por llave y calcula la resta beta menos alfa', () => {
        const gdl = filas.find(f => f.llave === '14039');
        expect(gdl.alfa).toBe(21.4);
        expect(gdl.beta).toBe(23.1);
        expect(gdl.delta).toBeCloseTo(1.7, 5);
    });

    it('marca de qué lado viene una entidad sin par y le deja el delta en null', () => {
        const soloAlfa = filas.find(f => f.llave === '14008');
        const soloBeta = filas.find(f => f.llave === '14023');
        expect(soloAlfa.soloEn).toBe('A');
        expect(soloAlfa.delta).toBeNull();
        expect(soloBeta.soloEn).toBe('B');
        expect(soloBeta.beta).toBe(24.7);
    });

    it('cuenta el universo comparado sin esconder las que no tienen par', () => {
        expect(resumen).toEqual({
            total: 5, comparables: 3, subieron: 2, bajaron: 0, iguales: 1, sinPar: 2,
        });
    });

    it('conserva las propiedades para poder nombrar la fila', () => {
        expect(filas.find(f => f.llave === '14023').propiedades.nombre).toBe('Cuautitlán');
    });

    it('se queda con el primer registro cuando la llave viene repetida', () => {
        const repetida = [feature({ fid: 1, v: 10 }), feature({ fid: 1, v: 99 })];
        const { filas: unidas } = unirLados({ alfa: repetida, beta: [], llave: 'fid', campo: 'v' });
        expect(unidas).toHaveLength(1);
        expect(unidas[0].alfa).toBe(10);
    });

    it('no compara cuando falta la llave o el campo', () => {
        expect(unirLados({ alfa: ALFA, beta: BETA, llave: null, campo: 'temperatura' }).filas).toEqual([]);
        expect(unirLados({ alfa: ALFA, beta: BETA, llave: 'clave_municipio', campo: null }).resumen).toBeNull();
    });
});

describe('ordenarPorDelta', () => {
    const { filas } = unirLados({ alfa: ALFA, beta: BETA, llave: 'clave_municipio', campo: 'temperatura' });

    it('ordena de mayor a menor y manda al final las que no tienen par', () => {
        const orden = ordenarPorDelta(filas, 'desc').map(f => f.llave);
        expect(orden.slice(0, 3)).toEqual(['14120', '14039', '14063']);
        expect(orden.slice(3).sort()).toEqual(['14008', '14023']);
    });

    it('invierte el orden sin mover a las que no tienen par', () => {
        const orden = ordenarPorDelta(filas, 'asc').map(f => f.llave);
        expect(orden.slice(0, 3)).toEqual(['14063', '14039', '14120']);
        expect(orden.slice(3).sort()).toEqual(['14008', '14023']);
    });
});

describe('soloLosQueCambiaron', () => {
    const { filas } = unirLados({ alfa: ALFA, beta: BETA, llave: 'clave_municipio', campo: 'temperatura' });

    it('quita las que no se movieron pero conserva las que no tienen par', () => {
        const claves = soloLosQueCambiaron(filas).map(f => f.llave).sort();
        expect(claves).toEqual(['14008', '14023', '14039', '14120']);
    });
});

describe('TOPE_UNION', () => {
    it('queda por debajo del techo de la paginación del WFS', () => {
        expect(TOPE_UNION).toBeLessThan(100 * 200);
    });
});
