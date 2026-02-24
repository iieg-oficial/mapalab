import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/services/searchConfig', () => ({
    getSearchConfig: vi.fn(),
    getAllLayerIds: vi.fn(),
    findAllMatches: vi.fn()
}));

import {
    fetchMunicipios,
    fetchDirecciones,
    searchInLayer,
    searchInMultipleLayers,
    fetchAutocomplete,
    searchGlobal
} from '@/services/searchService';

import { getSearchConfig, getAllLayerIds, findAllMatches } from '@/services/searchConfig';

const mockConfig = {
    hasMunicipio: true,
    hasDireccion: true,
    searchableFields: ['nombre', 'clave'],
    municipioField: 'municipio',
    direccionField: 'direccion'
};

const makeOkResponse = (data) => ({
    ok: true,
    json: async () => data
});

const makeErrorResponse = (status) => ({
    ok: false,
    status
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    global.fetch = vi.fn();
    getSearchConfig.mockReturnValue(mockConfig);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('fetchMunicipios', () => {
    it('lanza si la capa no tiene config', async () => {
        getSearchConfig.mockReturnValue(null);
        await expect(fetchMunicipios('sin-config')).rejects.toThrow();
    });

    it('lanza si la capa no tiene hasMunicipio', async () => {
        getSearchConfig.mockReturnValue({ ...mockConfig, hasMunicipio: false });
        await expect(fetchMunicipios('capa-test')).rejects.toThrow();
    });

    it('retorna datos en fetch exitoso', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({ results: ['GDL', 'ZAP'] }));
        const result = await fetchMunicipios('capa-test');
        expect(result).toEqual({ results: ['GDL', 'ZAP'] });
    });

    it('incluye el layerId en la URL', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({}));
        await fetchMunicipios('capa-test');
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('layer=capa-test');
    });

    it('incluye filtros adicionales en la URL', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({}));
        await fetchMunicipios('capa-test', { tipo: 'urbano' });
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('tipo=urbano');
    });

    it('omite filtros con valor vacío o null', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({}));
        await fetchMunicipios('capa-test', { campo: null, otro: '' });
        const url = global.fetch.mock.calls[0][0];
        expect(url).not.toContain('campo=');
        expect(url).not.toContain('otro=');
    });

    it('lanza en error HTTP', async () => {
        global.fetch.mockResolvedValue(makeErrorResponse(500));
        await expect(fetchMunicipios('capa-test')).rejects.toThrow('Error HTTP: 500');
    });
});

describe('fetchDirecciones', () => {
    it('lanza si la capa no tiene hasDireccion', async () => {
        getSearchConfig.mockReturnValue({ ...mockConfig, hasDireccion: false });
        await expect(fetchDirecciones('capa-test')).rejects.toThrow();
    });

    it('retorna datos en fetch exitoso', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({ results: ['Av. Vallarta 1'] }));
        const result = await fetchDirecciones('capa-test');
        expect(result).toEqual({ results: ['Av. Vallarta 1'] });
    });

    it('incluye el layerId en la URL', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({}));
        await fetchDirecciones('capa-test');
        expect(global.fetch.mock.calls[0][0]).toContain('layer=capa-test');
    });
});

describe('searchInLayer', () => {
    it('lanza si la capa no está en config', async () => {
        getSearchConfig.mockReturnValue(null);
        await expect(searchInLayer('no-config', 'query')).rejects.toThrow();
    });

    it('retorna datos en fetch exitoso', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({ results: [{ id: 1 }] }));
        const result = await searchInLayer('capa-test', 'hospital');
        expect(result).toEqual({ results: [{ id: 1 }] });
    });

    it('incluye query en la URL', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({}));
        await searchInLayer('capa-test', 'hospital');
        expect(global.fetch.mock.calls[0][0]).toContain('q=hospital');
    });

    it('no incluye q si el query es falsy', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({}));
        await searchInLayer('capa-test', '');
        expect(global.fetch.mock.calls[0][0]).not.toContain('q=');
    });

    it('incluye filtros adicionales en la URL', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({}));
        await searchInLayer('capa-test', 'q', { municipio: 'GDL' });
        expect(global.fetch.mock.calls[0][0]).toContain('municipio=GDL');
    });

    it('lanza en error HTTP', async () => {
        global.fetch.mockResolvedValue(makeErrorResponse(404));
        await expect(searchInLayer('capa-test', 'q')).rejects.toThrow('Error HTTP: 404');
    });
});

describe('searchInMultipleLayers', () => {
    it('retorna resultados agrupados por layerId', async () => {
        global.fetch
            .mockResolvedValueOnce(makeOkResponse({ results: [{ id: 1 }] }))
            .mockResolvedValueOnce(makeOkResponse({ results: [{ id: 2 }] }));

        const result = await searchInMultipleLayers(['capa-a', 'capa-b'], 'test');
        expect(result['capa-a']).toEqual({ results: [{ id: 1 }] });
        expect(result['capa-b']).toEqual({ results: [{ id: 2 }] });
    });

    it('incluye error en capas que fallan sin romper las demás', async () => {
        global.fetch
            .mockResolvedValueOnce(makeOkResponse({ results: [{ id: 1 }] }))
            .mockResolvedValueOnce(makeErrorResponse(500));

        const result = await searchInMultipleLayers(['capa-a', 'capa-b'], 'test');
        expect(result['capa-a']).toEqual({ results: [{ id: 1 }] });
        expect(result['capa-b']).toHaveProperty('error');
        expect(result['capa-b'].results).toEqual([]);
    });
});

describe('fetchAutocomplete', () => {
    it('lanza si el field no está en searchableFields', async () => {
        await expect(fetchAutocomplete('capa-test', 'campo-invalido', 'q')).rejects.toThrow();
    });

    it('lanza si la capa no tiene config', async () => {
        getSearchConfig.mockReturnValue(null);
        await expect(fetchAutocomplete('capa-test', 'nombre', 'q')).rejects.toThrow();
    });

    it('retorna sugerencias en fetch exitoso', async () => {
        global.fetch.mockResolvedValue(makeOkResponse(['Hospital Civil', 'Hospital General']));
        const result = await fetchAutocomplete('capa-test', 'nombre', 'hosp');
        expect(result).toEqual(['Hospital Civil', 'Hospital General']);
    });

    it('incluye layer, field y q en la URL', async () => {
        global.fetch.mockResolvedValue(makeOkResponse([]));
        await fetchAutocomplete('capa-test', 'nombre', 'hosp');
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('layer=capa-test');
        expect(url).toContain('field=nombre');
        expect(url).toContain('q=hosp');
    });
});

describe('searchGlobal', () => {
    it('retorna layerMatches usando findAllMatches', async () => {
        findAllMatches.mockReturnValue([{ layerId: 'hospitales', score: 30 }]);
        const result = await searchGlobal('hospital');
        expect(result.layerMatches).toEqual([{ layerId: 'hospitales', score: 30 }]);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('retorna layerMatches vacío si includeLayerNames es false', async () => {
        const result = await searchGlobal('hospital', { includeLayerNames: false });
        expect(result.layerMatches).toEqual([]);
    });

    it('busca en capas cuando includeLayerData es true', async () => {
        getAllLayerIds.mockReturnValue(['capa-a']);
        global.fetch.mockResolvedValue(makeOkResponse({ results: [{ id: 1 }] }));
        findAllMatches.mockReturnValue([]);

        const result = await searchGlobal('test', { includeLayerData: true });
        expect(result.dataMatches).toHaveProperty('capa-a');
    });

    it('hasDataResults es true si hay resultados de datos', async () => {
        getAllLayerIds.mockReturnValue(['capa-a']);
        global.fetch.mockResolvedValue(makeOkResponse({ results: [{ id: 1 }] }));
        findAllMatches.mockReturnValue([]);

        const result = await searchGlobal('test', { includeLayerData: true });
        expect(result.hasDataResults).toBe(true);
    });

    it('hasDataResults es false si no hay resultados', async () => {
        getAllLayerIds.mockReturnValue(['capa-a']);
        global.fetch.mockResolvedValue(makeOkResponse({ results: [] }));
        findAllMatches.mockReturnValue([]);

        const result = await searchGlobal('test', { includeLayerData: true });
        expect(result.hasDataResults).toBe(false);
    });

    it('usa layerIds proporcionados en lugar de getAllLayerIds', async () => {
        global.fetch.mockResolvedValue(makeOkResponse({ results: [] }));
        findAllMatches.mockReturnValue([]);

        await searchGlobal('test', { includeLayerData: true, layerIds: ['capa-especifica'] });
        expect(getAllLayerIds).not.toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
