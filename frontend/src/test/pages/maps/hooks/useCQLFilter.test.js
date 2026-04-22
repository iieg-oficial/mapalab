import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCQLFilter } from '@hooksMaps/useCQLFilter';

vi.mock('@hooks/useLayers', () => {
    const mockLayers = [
        {
            id: 'parent',
            children: [{ id: 'child' }, { id: 'child2' }]
        },
        { id: 'standalone' }
    ];
    return {
        useLayers: () => ({ layers: mockLayers, initialOrder: [], loading: false, error: null })
    };
});

describe('useCQLFilter - applyFilter / getFilter', () => {
    it('getFilter retorna null si no hay filtros', () => {
        const { result } = renderHook(() => useCQLFilter());
        expect(result.current.getFilter('capa-a')).toBeNull();
    });

    it('aplica un filtro y lo recupera con getFilter', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('capa-a', 'municipio', "municipio='GDL'"));
        expect(result.current.getFilter('capa-a')).toBe("municipio='GDL'");
    });

    it('combina múltiples filtros con AND', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => {
            result.current.applyFilter('capa-a', 'municipio', "municipio='GDL'");
            result.current.applyFilter('capa-a', 'tipo', "tipo='A'");
        });
        const combined = result.current.getFilter('capa-a');
        expect(combined).toContain("municipio='GDL'");
        expect(combined).toContain("tipo='A'");
        expect(combined).toContain('AND');
    });

    it('ignora claves que empiezan con _', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => {
            result.current.applyFilter('capa-a', '_interno', 'valor-interno');
            result.current.applyFilter('capa-a', 'visible', "tipo='B'");
        });
        expect(result.current.getFilter('capa-a')).toBe("tipo='B'");
    });

    it('retorna null si solo hay filtros con clave _', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('capa-a', '_date', '2024-01-01'));
        expect(result.current.getFilter('capa-a')).toBeNull();
    });
});

describe('useCQLFilter - getSpecificFilter', () => {
    it('retorna el filtro específico por nombre', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('capa-a', 'municipio', "municipio='GDL'"));
        expect(result.current.getSpecificFilter('capa-a', 'municipio')).toBe("municipio='GDL'");
    });

    it('retorna null si el filtro no existe', () => {
        const { result } = renderHook(() => useCQLFilter());
        expect(result.current.getSpecificFilter('capa-a', 'municipio')).toBeNull();
    });
});

describe('useCQLFilter - clearFilter', () => {
    it('elimina un filtro específico', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => {
            result.current.applyFilter('capa-a', 'municipio', "municipio='GDL'");
            result.current.applyFilter('capa-a', 'tipo', "tipo='A'");
        });
        act(() => result.current.clearFilter('capa-a', 'municipio'));
        expect(result.current.getFilter('capa-a')).toBe("tipo='A'");
    });

    it('elimina la capa de filters si queda sin filtros', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('capa-a', 'municipio', "municipio='GDL'"));
        act(() => result.current.clearFilter('capa-a', 'municipio'));
        expect(result.current.filters['capa-a']).toBeUndefined();
    });
});

describe('useCQLFilter - clearLayerFilters / clearAllFilters', () => {
    it('clearLayerFilters elimina todos los filtros de una capa', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => {
            result.current.applyFilter('capa-a', 'f1', 'v1');
            result.current.applyFilter('capa-a', 'f2', 'v2');
        });
        act(() => result.current.clearLayerFilters('capa-a'));
        expect(result.current.filters['capa-a']).toBeUndefined();
    });

    it('clearLayerFilters no afecta otras capas', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => {
            result.current.applyFilter('capa-a', 'f1', 'v1');
            result.current.applyFilter('capa-b', 'f1', 'v1');
        });
        act(() => result.current.clearLayerFilters('capa-a'));
        expect(result.current.getFilter('capa-b')).toBe('v1');
    });

    it('clearAllFilters elimina todos los filtros', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => {
            result.current.applyFilter('capa-a', 'f1', 'v1');
            result.current.applyFilter('capa-b', 'f2', 'v2');
        });
        act(() => result.current.clearAllFilters());
        expect(result.current.filters).toEqual({});
    });
});

describe('useCQLFilter - hasFilter', () => {
    it('retorna false si no hay filtro', () => {
        const { result } = renderHook(() => useCQLFilter());
        expect(result.current.hasFilter('capa-a')).toBe(false);
    });

    it('retorna true si hay algún filtro', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('capa-a', 'f1', 'v1'));
        expect(result.current.hasFilter('capa-a')).toBe(true);
    });

    it('retorna true si el filtro específico existe', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('capa-a', 'municipio', 'v1'));
        expect(result.current.hasFilter('capa-a', 'municipio')).toBe(true);
    });

    it('retorna false si el filtro específico no existe', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('capa-a', 'municipio', 'v1'));
        expect(result.current.hasFilter('capa-a', 'tipo')).toBe(false);
    });
});

describe('useCQLFilter - herencia jerárquica', () => {
    it('un hijo hereda el filtro del padre', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => result.current.applyFilter('parent', 'f1', "tipo='A'"));
        expect(result.current.getFilter('child')).toBe("tipo='A'");
    });

    it('el filtro propio del hijo tiene precedencia sobre el padre', () => {
        const { result } = renderHook(() => useCQLFilter());
        act(() => {
            result.current.applyFilter('parent', 'f1', "tipo='A'");
            result.current.applyFilter('child', 'f1', "tipo='B'");
        });
        expect(result.current.getFilter('child')).toBe("tipo='B'");
    });
});
