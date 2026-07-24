import { describe, it, expect } from 'vitest';
import {
    buildCatalogoPath,
    buildCatalogoShareUrl,
    cqlToFechaParam,
    fechaParamToCql,
    filterCapas,
    resolveCatalogoRoute,
} from '@pages/catalogo/helpers/catalogoRoutes';

const CAPAS = [
    { slug: 'pozos', nombre: 'Pozos de agua', searchTags: ['agua'], institucion: { slug: 'sader', nombre: 'SADER' } },
    { slug: 'escuelas', nombre: 'Escuelas', searchTags: [], institucion: { slug: 'iieg', nombre: 'IIEG' } },
    { slug: 'sin-duenio', nombre: 'Capa suelta', searchTags: ['varios'], institucion: null },
];

const INSTITUCIONES = [
    { slug: 'sader', nombre: 'SADER' },
    { slug: 'iieg', nombre: 'IIEG' },
];

describe('buildCatalogoPath', () => {
    it('arma la raiz sin argumentos', () => {
        expect(buildCatalogoPath()).toBe('/catalogo');
    });

    it('arma la ruta de una capa suelta', () => {
        expect(buildCatalogoPath({ capaSlug: 'pozos' })).toBe('/catalogo/pozos');
    });

    it('arma la ruta de una institucion', () => {
        expect(buildCatalogoPath({ institucionSlug: 'sader' })).toBe('/catalogo/sader');
    });

    it('anida la capa dentro de la institucion', () => {
        expect(buildCatalogoPath({ institucionSlug: 'sader', capaSlug: 'pozos' }))
            .toBe('/catalogo/sader/pozos');
    });
});

describe('buildCatalogoShareUrl', () => {
    it('genera una URL absoluta con el origen actual', () => {
        const url = buildCatalogoShareUrl({ institucionSlug: 'sader', capaSlug: 'pozos' });
        expect(url.startsWith(window.location.origin)).toBe(true);
        expect(url.endsWith('/catalogo/sader/pozos')).toBe(true);
    });

    it('no duplica diagonales', () => {
        expect(buildCatalogoShareUrl({ capaSlug: 'pozos' })).not.toContain('//catalogo');
    });
});

describe('resolveCatalogoRoute', () => {
    it('sin segmentos deja el catalogo completo', () => {
        expect(resolveCatalogoRoute(undefined, undefined, CAPAS, INSTITUCIONES))
            .toEqual({ institucionSlug: null, capaSlug: null, notFound: false });
    });

    it('un segmento que es capa resuelve a capa', () => {
        expect(resolveCatalogoRoute('pozos', undefined, CAPAS, INSTITUCIONES))
            .toEqual({ institucionSlug: null, capaSlug: 'pozos', notFound: false });
    });

    it('un segmento que es institucion resuelve a modo institucion', () => {
        expect(resolveCatalogoRoute('sader', undefined, CAPAS, INSTITUCIONES))
            .toEqual({ institucionSlug: 'sader', capaSlug: null, notFound: false });
    });

    it('la capa gana cuando el slug existe en ambos lados', () => {
        const capas = [{ slug: 'sader', nombre: 'Capa homonima' }];
        expect(resolveCatalogoRoute('sader', undefined, capas, INSTITUCIONES))
            .toEqual({ institucionSlug: null, capaSlug: 'sader', notFound: false });
    });

    it('dos segmentos resuelven institucion + capa', () => {
        expect(resolveCatalogoRoute('sader', 'pozos', CAPAS, INSTITUCIONES))
            .toEqual({ institucionSlug: 'sader', capaSlug: 'pozos', notFound: false });
    });

    it('dos segmentos con institucion desconocida cargan la capa sin contexto', () => {
        expect(resolveCatalogoRoute('inventada', 'pozos', CAPAS, INSTITUCIONES))
            .toEqual({ institucionSlug: null, capaSlug: 'pozos', notFound: true });
    });

    it('marca notFound cuando el slug no existe en ningun lado', () => {
        expect(resolveCatalogoRoute('nada', undefined, CAPAS, INSTITUCIONES))
            .toEqual({ institucionSlug: null, capaSlug: null, notFound: true });
    });
});

describe('fecha en la URL (ida y vuelta)', () => {
    it('un año se serializa y se recupera equivalente', () => {
        const param = cqlToFechaParam("(fecha >= '2026-01-01' AND fecha < '2027-01-01')");
        expect(param).toBe('2026');
        const cql = fechaParamToCql(param);
        expect(cqlToFechaParam(cql)).toBe('2026');
    });

    it('un mes concreto sobrevive el viaje', () => {
        const cql = fechaParamToCql('2026-6');
        expect(cqlToFechaParam(cql)).toBe('2026-6');
    });

    it('varios meses se preservan', () => {
        const param = cqlToFechaParam("((fecha >= '2026-01-01' AND fecha < '2026-02-01') OR (fecha >= '2026-06-01' AND fecha < '2026-07-01'))");
        expect(param.split(',').sort()).toEqual(['2026-1', '2026-6']);
    });

    it('vacío o nulo no produce filtro', () => {
        expect(cqlToFechaParam(null)).toBe(null);
        expect(fechaParamToCql(null)).toBe(null);
        expect(fechaParamToCql('')).toBe(null);
    });
});

describe('filterCapas', () => {
    it('sin filtros devuelve todo', () => {
        expect(filterCapas(CAPAS)).toHaveLength(3);
    });

    it('filtra por institucion', () => {
        const result = filterCapas(CAPAS, { institucionSlug: 'sader' });
        expect(result.map((c) => c.slug)).toEqual(['pozos']);
    });

    it('deja fuera las capas sin institucion al filtrar', () => {
        expect(filterCapas(CAPAS, { institucionSlug: 'iieg' }).map((c) => c.slug))
            .toEqual(['escuelas']);
    });

    it('busca por nombre sin distinguir mayusculas', () => {
        expect(filterCapas(CAPAS, { query: 'ESCUELA' }).map((c) => c.slug)).toEqual(['escuelas']);
    });

    it('busca por etiqueta', () => {
        expect(filterCapas(CAPAS, { query: 'agua' }).map((c) => c.slug)).toEqual(['pozos']);
    });

    it('busca por nombre de institucion', () => {
        expect(filterCapas(CAPAS, { query: 'sader' }).map((c) => c.slug)).toEqual(['pozos']);
    });

    it('busca por slug de institucion', () => {
        expect(filterCapas(CAPAS, { query: 'iieg' }).map((c) => c.slug)).toEqual(['escuelas']);
    });

    it('combina institucion y texto', () => {
        expect(filterCapas(CAPAS, { institucionSlug: 'iieg', query: 'agua' })).toHaveLength(0);
    });
});
