import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccordion } from '@hooksMaps/useAccordion';

describe('useAccordion - estado inicial', () => {
    it('inicia con el índice expandido en 0 por defecto', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3]));
        expect(result.current.expandedIndex).toBe(0);
    });

    it('respeta el initialExpandedIndex proporcionado', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 2));
        expect(result.current.expandedIndex).toBe(2);
    });

    it('auto-expande el índice 0 si se pasa null con items no vacíos', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], null));
        expect(result.current.expandedIndex).toBe(0);
    });
});

describe('useAccordion - toggleItem', () => {
    it('expande un ítem al llamar toggleItem', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], null));
        act(() => result.current.toggleItem(1));
        expect(result.current.expandedIndex).toBe(1);
    });

    it('colapsa el ítem activo al llamar toggleItem de nuevo', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 0));
        act(() => result.current.toggleItem(0));
        expect(result.current.expandedIndex).toBeNull();
    });

    it('cambia al nuevo ítem al llamar toggleItem con índice diferente', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 0));
        act(() => result.current.toggleItem(2));
        expect(result.current.expandedIndex).toBe(2);
    });
});

describe('useAccordion - expandItem', () => {
    it('expande un ítem específico', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], null));
        act(() => result.current.expandItem(1));
        expect(result.current.expandedIndex).toBe(1);
    });

    it('sobreescribe el ítem expandido actual', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 0));
        act(() => result.current.expandItem(2));
        expect(result.current.expandedIndex).toBe(2);
    });
});

describe('useAccordion - collapseAll', () => {
    it('colapsa todos los ítems', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 0));
        act(() => result.current.collapseAll());
        expect(result.current.expandedIndex).toBeNull();
    });
});

describe('useAccordion - isExpanded', () => {
    it('retorna true para el ítem expandido', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 1));
        expect(result.current.isExpanded(1)).toBe(true);
    });

    it('retorna false para ítems no expandidos', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 1));
        expect(result.current.isExpanded(0)).toBe(false);
        expect(result.current.isExpanded(2)).toBe(false);
    });

    it('retorna false tras collapseAll', () => {
        const { result } = renderHook(() => useAccordion([1, 2, 3], 0));
        act(() => result.current.collapseAll());
        expect(result.current.isExpanded(0)).toBe(false);
    });
});
