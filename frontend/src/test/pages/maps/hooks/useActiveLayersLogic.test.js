import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveLayersLogic } from '@hooksMaps/useActiveLayersLogic';

vi.mock('@pages/maps/helpers/layers/index', () => {
    const mockLayers = [
        {
            id: 'parent-layer',
            label: 'Capa Padre',
            forceGroup: true,
            children: [
                { id: 'child-layer', label: 'Capa Hija' }
            ]
        },
        {
            id: 'theme-layer',
            label: 'Capa Tema',
            children: [
                {
                    id: 'group-layer',
                    label: 'Capa Grupo',
                    forceGroup: true,
                    children: [
                        {
                            id: 'subgroup-layer',
                            label: 'Capa Subgrupo',
                            children: [
                                { id: 'deep-child-layer', label: 'Capa Hija Profunda' }
                            ]
                        }
                    ]
                }
            ]
        },
        { id: 'standalone-layer', label: 'Capa Independiente' }
    ];

    const findById = (id, list) => {
        for (const item of list) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    };

    const collectChildIds = (layer) => {
        if (!layer.children) return [layer.id];
        return layer.children.flatMap(collectChildIds);
    };

    return {
        layers: mockLayers,
        findLayerById: (id) => findById(id, mockLayers),
        getAllChildLayerIds: (id) => {
            const layer = findById(id, mockLayers);
            return layer ? collectChildIds(layer) : [];
        }
    };
});

describe('useActiveLayersLogic', () => {
    it('debería retornar la capa padre cuando la capa hija está activa', () => {
        const activeLayerIds = ['child-layer'];
        const hiddenLayerIds = [];

        const { result } = renderHook(() => useActiveLayersLogic(activeLayerIds, hiddenLayerIds));

        const unifiedLayers = result.current.unifiedLayers;

        const parentLayer = unifiedLayers.find(layer => layer.id === 'parent-layer');
        expect(parentLayer).toBeDefined();
        expect(parentLayer.name).toBe('Capa Padre');
        expect(parentLayer.hasChildren).toBe(true);
    });

    it('debería retornar la capa independiente cuando está activa', () => {
        const activeLayerIds = ['standalone-layer'];
        const hiddenLayerIds = [];

        const { result } = renderHook(() => useActiveLayersLogic(activeLayerIds, hiddenLayerIds));

        const unifiedLayers = result.current.unifiedLayers;

        const layer = unifiedLayers.find(l => l.id === 'standalone-layer');
        expect(layer).toBeDefined();
        expect(layer.name).toBe('Capa Independiente');
    });

    it('debería retornar la capa de grupo (ancestro hijo raíz) cuando una capa hija profunda está activa', () => {
        const activeLayerIds = ['deep-child-layer'];
        const hiddenLayerIds = [];

        const { result } = renderHook(() => useActiveLayersLogic(activeLayerIds, hiddenLayerIds));

        const unifiedLayers = result.current.unifiedLayers;

        const groupLayer = unifiedLayers.find(layer => layer.id === 'group-layer');
        expect(groupLayer).toBeDefined();
        expect(groupLayer.name).toBe('Capa Grupo');
        expect(groupLayer.hasChildren).toBe(true);
    });
});
