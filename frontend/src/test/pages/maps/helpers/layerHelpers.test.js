import { describe, it, expect } from 'vitest';
import {
    findLayerById,
    validateLayer,
    getAllChildLayerIds,
    collectLayersWithWMS,
    collectLayerIdsWithWMS,
    findParentGroup,
    getSymbologyStats,
    resolveGeometryType,
    resolveSelectedLayerLabel
} from '@pages/maps/helpers/layers/utils/layerHelpers';

const LAYERS = [
    {
        id: 'group-a',
        label: 'Group A',
        forceGroup: true,
        children: [
            {
                id: 'layer-1',
                label: 'Layer 1',
                wmsConfig: { workspace: 'economia' }
            },
            {
                id: 'label-node',
                label: 'Label',
                isLabel: true,
                children: [
                    {
                        id: 'layer-2',
                        label: 'Layer 2',
                        wmsConfig: { workspace: 'salud' },
                        symbology: [{ isFallback: false }]
                    }
                ]
            }
        ]
    },
    {
        id: 'leaf',
        label: 'Leaf',
        wmsConfig: { workspace: 'general' }
    }
];

describe('findLayerById', () => {
    it('encuentra una capa en el nivel raíz', () => {
        expect(findLayerById('leaf', LAYERS).id).toBe('leaf');
    });

    it('encuentra una capa anidada en profundidad 2', () => {
        expect(findLayerById('layer-1', LAYERS).id).toBe('layer-1');
    });

    it('encuentra una capa anidada en profundidad 3', () => {
        expect(findLayerById('layer-2', LAYERS).id).toBe('layer-2');
    });

    it('retorna null para ID inexistente', () => {
        expect(findLayerById('no-existe', LAYERS)).toBeNull();
    });

    it('retorna null para lista vacía', () => {
        expect(findLayerById('leaf', [])).toBeNull();
    });
});

describe('validateLayer', () => {
    it('retorna true cuando tiene id y label', () => {
        expect(validateLayer({ id: 'a', label: 'A' })).toBe(true);
    });

    it('retorna false cuando falta id', () => {
        expect(validateLayer({ label: 'A' })).toBe(false);
    });

    it('retorna false cuando falta label', () => {
        expect(validateLayer({ id: 'a' })).toBe(false);
    });
});

describe('getAllChildLayerIds', () => {
    it('retorna todos los IDs descendientes recursivamente', () => {
        const ids = getAllChildLayerIds('group-a', LAYERS);
        expect(ids).toContain('layer-1');
        expect(ids).toContain('label-node');
        expect(ids).toContain('layer-2');
    });

    it('retorna arreglo vacío para una capa hoja sin hijos', () => {
        expect(getAllChildLayerIds('leaf', LAYERS)).toEqual([]);
    });

    it('retorna arreglo vacío para ID inexistente', () => {
        expect(getAllChildLayerIds('no-existe', LAYERS)).toEqual([]);
    });
});

describe('collectLayersWithWMS', () => {
    it('retorna todas las capas con wmsConfig en un árbol', () => {
        const ids = collectLayersWithWMS(LAYERS[0]).map(l => l.id);
        expect(ids).toContain('layer-1');
        expect(ids).toContain('layer-2');
    });

    it('no incluye capas sin wmsConfig', () => {
        const result = collectLayersWithWMS(LAYERS[0]);
        expect(result.every(l => l.wmsConfig)).toBe(true);
    });

    it('incluye la capa raíz si tiene wmsConfig', () => {
        const result = collectLayersWithWMS(LAYERS[1]);
        expect(result[0].id).toBe('leaf');
    });

    it('retorna arreglo vacío para null', () => {
        expect(collectLayersWithWMS(null)).toEqual([]);
    });
});

describe('collectLayerIdsWithWMS', () => {
    it('retorna solo los IDs de capas con wmsConfig', () => {
        const ids = collectLayerIdsWithWMS(LAYERS[0]);
        expect(ids).toContain('layer-1');
        expect(ids).toContain('layer-2');
        expect(ids).not.toContain('label-node');
        expect(ids).not.toContain('group-a');
    });
});

describe('findParentGroup', () => {
    it('retorna el padre con forceGroup=true para un hijo directo', () => {
        const parent = findParentGroup('layer-1', LAYERS);
        expect(parent.id).toBe('group-a');
    });

    it('retorna el ancestro forceGroup aunque el padre inmediato sea isLabel', () => {
        const parent = findParentGroup('layer-2', LAYERS);
        expect(parent.id).toBe('group-a');
    });

    it('retorna null para una capa raíz sin ancestro forceGroup', () => {
        const parent = findParentGroup('leaf', LAYERS);
        expect(parent).toBeNull();
    });
});

describe('getSymbologyStats', () => {
    it('cuenta total, withSymbology y withoutSymbology correctamente', () => {
        const stats = getSymbologyStats(LAYERS);
        expect(stats.total).toBe(3);
        expect(stats.withSymbology).toBe(1);
        expect(stats.withoutSymbology).toBe(2);
    });

    it('retorna ceros para lista vacía', () => {
        const stats = getSymbologyStats([]);
        expect(stats.total).toBe(0);
        expect(stats.withSymbology).toBe(0);
        expect(stats.withoutSymbology).toBe(0);
    });

    it('detecta simbología fallback', () => {
        const layers = [{ id: 'l', wmsConfig: {}, symbology: [{ isFallback: true }] }];
        const stats = getSymbologyStats(layers);
        expect(stats.fallbackSymbology).toBe(1);
    });
});

describe('resolveGeometryType', () => {
    it('devuelve null sin nodo', () => {
        expect(resolveGeometryType(null)).toBeNull();
    });

    it('devuelve el tipo propio de la hoja', () => {
        expect(resolveGeometryType({ id: 'l', wmsConfig: {}, geometryType: 'point' })).toBe('point');
    });

    it('hereda el tipo del primer descendiente con WMS', () => {
        const grupo = {
            id: 'g',
            children: [
                { id: 'sin-wms', geometryType: 'raster' },
                { id: 'hijo', wmsConfig: {}, geometryType: 'polygon' }
            ]
        };
        expect(resolveGeometryType(grupo)).toBe('polygon');
    });

    it('devuelve null cuando ningun descendiente lo trae', () => {
        expect(resolveGeometryType({ id: 'g', children: [{ id: 'h', wmsConfig: {} }] })).toBeNull();
    });
});

describe('resolveSelectedLayerLabel', () => {
    const arbol = [
        {
            id: 'clima',
            label: 'Clima',
            children: [
                { id: 'temperatura_media_mensual', label: 'Temperatura media mensual' },
            ],
        },
    ];

    it('toma el label del arbol aunque la seleccion no lo traiga', () => {
        const seleccion = { id: 'temperatura_media_mensual', name: 'temperaturas' };
        expect(resolveSelectedLayerLabel(seleccion, arbol)).toBe('Temperatura media mensual');
    });

    it('prefiere el arbol sobre un name desactualizado', () => {
        const seleccion = { id: 'temperatura_media_mensual', label: 'Nombre viejo' };
        expect(resolveSelectedLayerLabel(seleccion, arbol)).toBe('Temperatura media mensual');
    });

    it('cae al label o al name cuando el id no esta en el arbol', () => {
        expect(resolveSelectedLayerLabel({ id: 'fantasma', label: 'Suelta' }, arbol)).toBe('Suelta');
        expect(resolveSelectedLayerLabel({ id: 'fantasma', name: 'Por name' }, arbol)).toBe('Por name');
    });

    it('retorna null sin seleccion o sin id', () => {
        expect(resolveSelectedLayerLabel(null, arbol)).toBeNull();
        expect(resolveSelectedLayerLabel({ label: 'Sin id' }, arbol)).toBeNull();
    });

    it('no revienta con un arbol ausente', () => {
        expect(resolveSelectedLayerLabel({ id: 'x', name: 'X' }, undefined)).toBe('X');
    });
});
