import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveLayersLogic } from '@hooksMaps/useActiveLayersLogic';

vi.mock('@pages/maps/helpers/layers/index', () => ({
    layers: [
        {
            id: 'parent-layer',
            label: 'Capa Padre',
            children: [
                {
                    id: 'child-layer',
                    label: 'Capa Hija'
                }
            ]
        },
        {
            id: 'theme-layer',
            label: 'Capa Tema',
            children: [
                {
                    id: 'group-layer',
                    label: 'Capa Grupo',
                    children: [
                        {
                            id: 'subgroup-layer',
                            label: 'Capa Subgrupo',
                            children: [
                                {
                                    id: 'deep-child-layer',
                                    label: 'Capa Hija Profunda'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id: 'standalone-layer',
            label: 'Capa Independiente'
        }
    ]
}));

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
