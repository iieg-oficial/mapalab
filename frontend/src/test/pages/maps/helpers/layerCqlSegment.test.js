import { describe, it, expect, vi } from 'vitest';

const { mockFindLayerById, mockBuildLayerMunicipioCql } = vi.hoisted(() => ({
    mockFindLayerById: vi.fn(),
    mockBuildLayerMunicipioCql: vi.fn()
}));

vi.mock('@pages/maps/helpers/layers/utils/layerHelpers', () => ({
    findLayerById: (...args) => mockFindLayerById(...args)
}));

vi.mock('@pages/maps/helpers/municipioCqlBuilder', () => ({
    buildLayerMunicipioCql: (...args) => mockBuildLayerMunicipioCql(...args)
}));

import { buildLayerCqlSegment } from '@pages/maps/helpers/layerCqlSegment';

const combineCQLFilters = (base, dynamic) => {
    if (!base && !dynamic) return null;
    if (!base) return dynamic;
    if (!dynamic) return base;
    return `(${base}) AND (${dynamic})`;
};

const build = (overrides = {}) => buildLayerCqlSegment({
    subLayers: [{ id: 'capa', wmsConfig: {} }],
    layers: [],
    getFilter: () => null,
    combineCQLFilters,
    municipioContext: null,
    ...overrides
});

describe('buildLayerCqlSegment', () => {
    it('devuelve INCLUDE cuando no hay ningún filtro', () => {
        mockFindLayerById.mockReturnValue(null);
        expect(build()).toBe('INCLUDE');
    });

    it('devuelve 1=0 cuando la capa tiene defaultDate y no hay filtro', () => {
        mockFindLayerById.mockReturnValue({ defaultDate: 'latest' });
        expect(build()).toBe('1=0');
    });

    it('combina el filtro base con el dinámico', () => {
        mockFindLayerById.mockReturnValue(null);
        const segment = build({
            subLayers: [{ id: 'capa', wmsConfig: { cqlFilter: "tipo = 'A'" } }],
            getFilter: () => 'anio = 2026'
        });
        expect(segment).toBe("((tipo = 'A') AND (anio = 2026))");
    });

    it('une con OR los filtros de varias subcapas', () => {
        mockFindLayerById.mockReturnValue(null);
        const segment = build({
            subLayers: [
                { id: 'a', wmsConfig: { cqlFilter: "tipo = 'A'" } },
                { id: 'b', wmsConfig: { cqlFilter: "tipo = 'B'" } }
            ]
        });
        expect(segment).toBe("(tipo = 'A') OR (tipo = 'B')");
    });

    it('reemplaza INCLUDE por el filtro de municipio', () => {
        mockFindLayerById.mockReturnValue({ searchMeta: {} });
        mockBuildLayerMunicipioCql.mockReturnValue("clave IN ('039')");
        expect(build({ municipioContext: { active: true } })).toBe("clave IN ('039')");
    });

    it('antepone el municipio al filtro existente', () => {
        mockFindLayerById.mockReturnValue({ searchMeta: {} });
        mockBuildLayerMunicipioCql.mockReturnValue("clave IN ('039')");
        const segment = build({
            subLayers: [{ id: 'capa', wmsConfig: { cqlFilter: "tipo = 'A'" } }],
            municipioContext: { active: true }
        });
        expect(segment).toBe("(clave IN ('039')) AND ((tipo = 'A'))");
    });

    it('no aplica el municipio sobre 1=0', () => {
        mockFindLayerById.mockReturnValue({ defaultDate: 'latest' });
        mockBuildLayerMunicipioCql.mockReturnValue("clave IN ('039')");
        expect(build({ municipioContext: { active: true } })).toBe('1=0');
    });

    it('no aplica el municipio a las capas ráster', () => {
        mockFindLayerById.mockReturnValue({ searchMeta: {} });
        mockBuildLayerMunicipioCql.mockReturnValue("clave IN ('039')");
        const segment = build({
            subLayers: [{ id: 'capa', wmsConfig: { workspace: 'lluvia' } }],
            municipioContext: { active: true }
        });
        expect(segment).toBe('INCLUDE');
    });
});
