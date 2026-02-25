import { describe, it, expect, vi } from 'vitest';

vi.mock('@pages/maps/helpers/layers/index', () => ({
    layers: [
        {
            id: 'salud',
            label: 'Salud',
            children: [
                {
                    id: 'hospitales',
                    label: 'Hospitales',
                    wmsConfig: { layerName: 'salud:hospitales' },
                    searchMeta: {
                        searchableFields: ['nombre'],
                        hasMunicipio: true,
                        hasDireccion: false,
                        municipioField: 'municipio',
                        tags: ['hospital', 'clinica']
                    }
                },
                {
                    id: 'escuelas',
                    label: 'Escuelas Primarias',
                    wmsConfig: { layerName: 'educacion:escuelas' },
                    searchMeta: {
                        searchableFields: ['nombre', 'clave'],
                        hasMunicipio: true,
                        hasDireccion: true
                    }
                }
            ]
        },
        {
            id: 'vialidad',
            label: 'Vialidad',
            children: [
                {
                    id: 'transporte',
                    label: 'Transporte',
                    children: [
                        {
                            id: 'rutas',
                            label: 'Rutas de Transporte',
                            wmsConfig: { layerName: 'vialidad:rutas' },
                            searchMeta: { tags: ['bus', 'ruta'] }
                        }
                    ]
                }
            ]
        }
    ]
}));

import {
    getSearchConfig,
    getAllLayerIds,
    isLayerSearchable,
    getThemes,
    getSubthemesByTheme,
    findBestMatch,
    findAllMatches,
    getLayersWithMunicipioSearch,
    getLayersWithDireccionSearch
} from '@/services/searchConfig';

describe('getSearchConfig', () => {
    it('retorna la config de una capa existente', () => {
        const config = getSearchConfig('hospitales');
        expect(config).not.toBeNull();
        expect(config.label).toBe('Hospitales');
        expect(config.tema).toBe('salud');
        expect(config.hasMunicipio).toBe(true);
    });

    it('retorna null para una capa inexistente', () => {
        expect(getSearchConfig('no-existe')).toBeNull();
    });

    it('incluye searchableFields', () => {
        const config = getSearchConfig('escuelas');
        expect(config.searchableFields).toContain('nombre');
        expect(config.searchableFields).toContain('clave');
    });

    it('asigna subtema correcto para capa anidada', () => {
        const config = getSearchConfig('rutas');
        expect(config.tema).toBe('vialidad');
        expect(config.subtema).toBe('transporte');
    });
});

describe('getAllLayerIds', () => {
    it('retorna todos los ids de capas con wmsConfig', () => {
        const ids = getAllLayerIds();
        expect(ids).toContain('hospitales');
        expect(ids).toContain('escuelas');
        expect(ids).toContain('rutas');
    });

    it('no incluye ids de grupos sin wmsConfig', () => {
        const ids = getAllLayerIds();
        expect(ids).not.toContain('salud');
        expect(ids).not.toContain('transporte');
    });
});

describe('isLayerSearchable', () => {
    it('retorna true para capa existente', () => {
        expect(isLayerSearchable('hospitales')).toBe(true);
    });

    it('retorna false para capa inexistente', () => {
        expect(isLayerSearchable('no-existe')).toBe(false);
    });
});

describe('getLayersWithMunicipioSearch', () => {
    it('retorna solo capas con hasMunicipio true', () => {
        const result = getLayersWithMunicipioSearch();
        const ids = result.map(l => l.id);
        expect(ids).toContain('hospitales');
        expect(ids).toContain('escuelas');
        expect(ids).not.toContain('rutas');
    });
});

describe('getLayersWithDireccionSearch', () => {
    it('retorna solo capas con hasDireccion true', () => {
        const result = getLayersWithDireccionSearch();
        const ids = result.map(l => l.id);
        expect(ids).toContain('escuelas');
        expect(ids).not.toContain('hospitales');
    });
});

describe('getThemes', () => {
    it('retorna los temas únicos', () => {
        const themes = getThemes();
        const ids = themes.map(t => t.id);
        expect(ids).toContain('salud');
        expect(ids).toContain('vialidad');
    });

    it('no retorna duplicados', () => {
        const themes = getThemes();
        const ids = themes.map(t => t.id);
        expect(ids.length).toBe(new Set(ids).size);
    });
});

describe('getSubthemesByTheme', () => {
    it('retorna subtemas del tema dado', () => {
        const subtemas = getSubthemesByTheme('vialidad');
        expect(subtemas['transporte']).toBeDefined();
        expect(subtemas['transporte'].layers).toContainEqual(
            expect.objectContaining({ id: 'rutas' })
        );
    });

    it('retorna objeto vacío para tema inexistente', () => {
        expect(getSubthemesByTheme('no-existe')).toEqual({});
    });
});

describe('findBestMatch', () => {
    it('encuentra la mejor coincidencia por label exacto', () => {
        const result = findBestMatch('hospitales');
        expect(result).not.toBeNull();
        expect(result.layerId).toBe('hospitales');
    });

    it('encuentra coincidencia por tag', () => {
        const result = findBestMatch('clinica');
        expect(result).not.toBeNull();
        expect(result.layerId).toBe('hospitales');
    });

    it('retorna null para query vacío', () => {
        expect(findBestMatch('')).toBeNull();
        expect(findBestMatch('   ')).toBeNull();
    });

    it('retorna null si no hay coincidencias', () => {
        expect(findBestMatch('xyzqwerty123')).toBeNull();
    });

    it('retorna el resultado con mayor score primero', () => {
        const result = findBestMatch('hospital');
        expect(result.layerId).toBe('hospitales');
        expect(result.score).toBeGreaterThan(0);
    });
});

describe('findAllMatches', () => {
    it('retorna array de coincidencias ordenadas por score', () => {
        const results = findAllMatches('hospital');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].layerId).toBe('hospitales');
    });

    it('retorna array vacío para query vacío', () => {
        expect(findAllMatches('')).toEqual([]);
    });

    it('respeta el minScore mínimo', () => {
        const withLowScore = findAllMatches('ruta', 1);
        const withHighScore = findAllMatches('ruta', 9999);
        expect(withLowScore.length).toBeGreaterThanOrEqual(withHighScore.length);
    });

    it('los resultados están ordenados de mayor a menor score', () => {
        const results = findAllMatches('hospital', 1);
        for (let i = 1; i < results.length; i++) {
            expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
        }
    });

    it('incluye label en cada resultado', () => {
        const results = findAllMatches('hospital');
        expect(results[0]).toHaveProperty('label');
        expect(results[0]).toHaveProperty('layerId');
        expect(results[0]).toHaveProperty('score');
    });
});
