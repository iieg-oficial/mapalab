import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayerManagement } from '@hooksMaps/useLayerManagement';

const { mockFindLayerById, mockGetAllChildLayerIds } = vi.hoisted(() => ({
    mockFindLayerById: vi.fn(),
    mockGetAllChildLayerIds: vi.fn()
}));

vi.mock('@hooks/useLayers', () => ({
    useLayers: () => ({
        layers: [
            {
                id: 'parent',
                children: [
                    { id: 'child-1' },
                    { id: 'label-node', isLabel: true, children: [{ id: 'child-3' }] }
                ]
            },
            { id: 'orphan' }
        ],
        initialOrder: [],
        loading: false,
        error: null
    })
}));

vi.mock('@pages/maps/helpers/layers/utils/layerHelpers', () => ({
    findLayerById: mockFindLayerById,
    getAllChildLayerIds: mockGetAllChildLayerIds
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useLayerManagement - activeLayerIds', () => {
    it('inicia con arreglo vacío', () => {
        const { result } = renderHook(() => useLayerManagement());
        expect(result.current.activeLayerIds).toEqual([]);
    });

    it('actualiza activeLayerIds con setActiveLayerIds', () => {
        const { result } = renderHook(() => useLayerManagement());
        act(() => result.current.setActiveLayerIds(['capa-1']));
        expect(result.current.activeLayerIds).toEqual(['capa-1']);
    });

    it('soporta setActiveLayerIds con updater funcional', () => {
        const { result } = renderHook(() => useLayerManagement());
        act(() => result.current.setActiveLayerIds(['a', 'b']));
        act(() => result.current.setActiveLayerIds(prev => [...prev, 'c']));
        expect(result.current.activeLayerIds).toEqual(['a', 'b', 'c']);
    });
});

describe('useLayerManagement - delegación a helpers', () => {
    it('findLayerById delega al helper con la lista de layers', () => {
        mockFindLayerById.mockReturnValue({ id: 'x', name: 'X' });
        const { result } = renderHook(() => useLayerManagement());
        const layer = result.current.findLayerById('x');
        expect(mockFindLayerById).toHaveBeenCalledWith('x', expect.any(Array));
        expect(layer).toEqual({ id: 'x', name: 'X' });
    });

    it('getAllChildLayerIds delega al helper con la lista de layers', () => {
        mockGetAllChildLayerIds.mockReturnValue(['c-1', 'c-2']);
        const { result } = renderHook(() => useLayerManagement());
        const ids = result.current.getAllChildLayerIds('parent');
        expect(mockGetAllChildLayerIds).toHaveBeenCalledWith('parent', expect.any(Array));
        expect(ids).toEqual(['c-1', 'c-2']);
    });
});

describe('useLayerManagement - findParent', () => {
    it('encuentra el padre directo de una capa', () => {
        const { result } = renderHook(() => useLayerManagement());
        const parent = result.current.findParent('child-1');
        expect(parent.id).toBe('parent');
    });

    it('omite nodos isLabel y retorna el ancestro real', () => {
        const { result } = renderHook(() => useLayerManagement());
        const parent = result.current.findParent('child-3');
        expect(parent.id).toBe('parent');
    });

    it('retorna null para una capa sin padre', () => {
        const { result } = renderHook(() => useLayerManagement());
        const parent = result.current.findParent('orphan');
        expect(parent).toBeNull();
    });
});

describe('useLayerManagement - findAllAncestors', () => {
    it('retorna lista de ancestros de una capa hija', () => {
        const { result } = renderHook(() => useLayerManagement());
        const ancestors = result.current.findAllAncestors('child-1');
        expect(ancestors.map(a => a.id)).toContain('parent');
    });

    it('retorna arreglo vacío para capa raíz', () => {
        const { result } = renderHook(() => useLayerManagement());
        const ancestors = result.current.findAllAncestors('parent');
        expect(ancestors).toHaveLength(0);
    });
});

describe('useLayerManagement - getDirectChildIds', () => {
    it('retorna IDs de hijos directos excluyendo isLabel', () => {
        mockFindLayerById.mockReturnValue({
            id: 'parent',
            children: [
                { id: 'child-1' },
                { id: 'label-node', isLabel: true }
            ]
        });
        const { result } = renderHook(() => useLayerManagement());
        const childIds = result.current.getDirectChildIds('parent');
        expect(childIds).toEqual(['child-1']);
    });

    it('retorna arreglo vacío si la capa no tiene hijos', () => {
        mockFindLayerById.mockReturnValue({ id: 'leaf' });
        const { result } = renderHook(() => useLayerManagement());
        const childIds = result.current.getDirectChildIds('leaf');
        expect(childIds).toEqual([]);
    });

    it('retorna arreglo vacío si la capa no existe', () => {
        mockFindLayerById.mockReturnValue(null);
        const { result } = renderHook(() => useLayerManagement());
        const childIds = result.current.getDirectChildIds('inexistente');
        expect(childIds).toEqual([]);
    });
});

describe('useLayerManagement - reorderActiveLayerIds', () => {
    it('reemplaza activeLayerIds cuando se pasa un arreglo', () => {
        const { result } = renderHook(() => useLayerManagement());
        act(() => result.current.reorderActiveLayerIds(['a', 'b', 'c']));
        expect(result.current.activeLayerIds).toEqual(['a', 'b', 'c']);
    });

    it('reordena por índice (startIndex, endIndex)', () => {
        const { result } = renderHook(() => useLayerManagement());
        act(() => result.current.reorderActiveLayerIds(['a', 'b', 'c']));
        act(() => result.current.reorderActiveLayerIds(0, 2));
        expect(result.current.activeLayerIds).toEqual(['b', 'c', 'a']);
    });

    it('mueve hacia adelante en el arreglo', () => {
        const { result } = renderHook(() => useLayerManagement());
        act(() => result.current.reorderActiveLayerIds(['a', 'b', 'c']));
        act(() => result.current.reorderActiveLayerIds(2, 0));
        expect(result.current.activeLayerIds).toEqual(['c', 'a', 'b']);
    });
});
