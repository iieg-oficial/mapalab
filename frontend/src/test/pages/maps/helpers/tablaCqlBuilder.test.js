import { describe, it, expect } from 'vitest';
import {
    combinar,
    construirBbox,
    construirCql,
    construirCqlColumna,
    descriptorVacio,
    etiquetaFiltro,
    familiaDeColumna,
    filtroHeredado,
} from '@pages/maps/helpers/tablaCqlBuilder';

describe('construirCqlColumna', () => {
    it('usa igualdad con un solo valor y IN con varios', () => {
        expect(construirCqlColumna('municipio', { familia: 'lista', valores: ['Zapopan'] }))
            .toBe("municipio = 'Zapopan'");
        expect(construirCqlColumna('municipio', { familia: 'lista', valores: ['Zapopan', 'Tonalá'] }))
            .toBe("municipio IN ('Zapopan','Tonalá')");
    });

    it('escapa las comillas simples de los valores', () => {
        expect(construirCqlColumna('nombre', { familia: 'lista', valores: ["O'Brien"] }))
            .toBe("nombre = 'O''Brien'");
        expect(construirCqlColumna('nombre', { familia: 'texto', contiene: "O'Brien" }))
            .toBe("nombre ILIKE '%O''Brien%'");
    });

    it('arma rangos numericos con los limites que existan', () => {
        expect(construirCqlColumna('alumnos', { familia: 'numero', min: 400, max: null }))
            .toBe('alumnos >= 400');
        expect(construirCqlColumna('alumnos', { familia: 'numero', min: 400, max: 900 }))
            .toBe('alumnos >= 400 AND alumnos <= 900');
    });

    it('trata la fecha como intervalo semiabierto', () => {
        expect(construirCqlColumna('fecha', { familia: 'fecha', desde: '2026-01-01', hasta: '2026-02-01' }))
            .toBe("fecha >= '2026-01-01' AND fecha < '2026-02-01'");
    });

    it('devuelve null cuando el descriptor no aporta nada', () => {
        expect(construirCqlColumna('x', { familia: 'lista', valores: [] })).toBeNull();
        expect(construirCqlColumna('x', { familia: 'texto', contiene: '   ' })).toBeNull();
        expect(construirCqlColumna('x', { familia: 'numero', min: null, max: null })).toBeNull();
        expect(construirCqlColumna('x', { familia: 'booleano', valor: null })).toBeNull();
        expect(descriptorVacio({ familia: 'texto', contiene: '' })).toBe(true);
    });
});

describe('construirCql y combinar', () => {
    it('une varias columnas con AND y parentesis', () => {
        const cql = construirCql({
            municipio: { familia: 'lista', valores: ['Zapopan'] },
            alumnos: { familia: 'numero', min: 400, max: null },
        });
        expect(cql).toBe("(municipio = 'Zapopan') AND (alumnos >= 400)");
    });

    it('no envuelve una sola expresion', () => {
        expect(combinar(['a = 1'])).toBe('a = 1');
        expect(combinar([null, undefined, ''])).toBeNull();
    });
});

describe('construirBbox', () => {
    it('incluye el campo de geometria y la proyeccion', () => {
        expect(construirBbox('geom', [1, 2, 3, 4], 'EPSG:3857'))
            .toBe("BBOX(geom, 1, 2, 3, 4, 'EPSG:3857')");
    });

    it('descarta extents incompletos o con valores no finitos', () => {
        expect(construirBbox('geom', [1, 2, 3], 'EPSG:3857')).toBeNull();
        expect(construirBbox('geom', [1, 2, 3, Infinity], 'EPSG:3857')).toBeNull();
        expect(construirBbox(null, [1, 2, 3, 4], 'EPSG:3857')).toBeNull();
    });
});

describe('filtroHeredado', () => {
    it('ignora las llaves internas y la propia de la tabla', () => {
        const heredado = filtroHeredado({
            municipio: "cve = '039'",
            _interno: 'no viaja',
            tabla: 'alumnos >= 400',
        }, false);
        expect(heredado).toBe("cve = '039'");
    });

    it('descarta la llave date en capas timeEnabled porque ahi es un instante TIME', () => {
        const filtros = { date: '2026-01-01', otro: 'tipo = 1' };
        expect(filtroHeredado(filtros, true)).toBe('tipo = 1');
        expect(filtroHeredado(filtros, false)).toBe('(2026-01-01) AND (tipo = 1)');
    });
});

describe('familiaDeColumna y etiquetaFiltro', () => {
    it('resuelve la familia desde el catalogo de campos', () => {
        const campos = [
            { nombre: 'alumnos', tipo: 'numero' },
            { nombre: 'fecha', tipo: 'fecha' },
            { nombre: 'nivel', tipo: 'texto', valores: ['Primaria', 'Secundaria'] },
            { nombre: 'nombre', tipo: 'texto' },
        ];
        expect(familiaDeColumna('alumnos', campos)).toBe('numero');
        expect(familiaDeColumna('fecha', campos)).toBe('fecha');
        expect(familiaDeColumna('nivel', campos)).toBe('lista');
        expect(familiaDeColumna('nombre', campos)).toBe('texto');
        expect(familiaDeColumna('desconocida', campos)).toBe('texto');
    });

    it('resume la lista cuando hay mas de dos valores', () => {
        expect(etiquetaFiltro('municipio', { familia: 'lista', valores: ['A', 'B', 'C'] }))
            .toBe('municipio: 3 valores');
        expect(etiquetaFiltro('alumnos', { familia: 'numero', min: 400, max: null }))
            .toBe('alumnos ≥ 400');
    });
});
