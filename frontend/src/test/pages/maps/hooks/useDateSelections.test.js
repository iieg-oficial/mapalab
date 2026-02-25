import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDateSelections } from '@hooksMaps/useDateSelections';

describe('useDateSelections - estado inicial', () => {
    it('inicia con selections vacías por defecto', () => {
        const { result } = renderHook(() => useDateSelections());
        expect(result.current.selections.size).toBe(0);
    });

    it('inicia con selections proporcionadas', () => {
        const initial = new Set(['2024-1']);
        const { result } = renderHook(() => useDateSelections(initial));
        expect(result.current.selections.has('2024-1')).toBe(true);
    });

    it('expande el año del primer selection inicial con mes', () => {
        const initial = new Set(['2024-1']);
        const { result } = renderHook(() => useDateSelections(initial));
        expect(result.current.expandedYear).toBe(2024);
    });

    it('expande el mes cuando hay un selection con día', () => {
        const initial = new Set(['2024-1-15']);
        const { result } = renderHook(() => useDateSelections(initial));
        expect(result.current.expandedMonth).toBe('2024-1');
    });

    it('expandedYear e expandedMonth son null por defecto', () => {
        const { result } = renderHook(() => useDateSelections());
        expect(result.current.expandedYear).toBeNull();
        expect(result.current.expandedMonth).toBeNull();
    });
});

describe('useDateSelections - handleYearClick', () => {
    it('agrega el año a selections', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleYearClick(2024));
        expect(result.current.selections.has('2024')).toBe(true);
    });

    it('elimina el año si ya estaba seleccionado', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleYearClick(2024));
        act(() => result.current.handleYearClick(2024));
        expect(result.current.selections.has('2024')).toBe(false);
    });
});

describe('useDateSelections - handleMonthClick', () => {
    it('agrega el mes a selections', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleMonthClick(2024, 1));
        expect(result.current.selections.has('2024-1')).toBe(true);
    });

    it('elimina el mes si ya estaba seleccionado', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleMonthClick(2024, 1));
        act(() => result.current.handleMonthClick(2024, 1));
        expect(result.current.selections.has('2024-1')).toBe(false);
    });

    it('elimina la clave del año si estaba en selections', () => {
        const initial = new Set(['2024']);
        const { result } = renderHook(() => useDateSelections(initial));
        act(() => result.current.handleMonthClick(2024, 1));
        expect(result.current.selections.has('2024')).toBe(false);
        expect(result.current.selections.has('2024-1')).toBe(true);
    });
});

describe('useDateSelections - handleDayClick', () => {
    it('agrega el día a selections', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleDayClick(2024, 1, 15));
        expect(result.current.selections.has('2024-1-15')).toBe(true);
    });

    it('elimina el día si ya estaba seleccionado', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleDayClick(2024, 1, 15));
        act(() => result.current.handleDayClick(2024, 1, 15));
        expect(result.current.selections.has('2024-1-15')).toBe(false);
    });

    it('elimina año y mes de selections al seleccionar un día', () => {
        const initial = new Set(['2024', '2024-1']);
        const { result } = renderHook(() => useDateSelections(initial));
        act(() => result.current.handleDayClick(2024, 1, 15));
        expect(result.current.selections.has('2024')).toBe(false);
        expect(result.current.selections.has('2024-1')).toBe(false);
        expect(result.current.selections.has('2024-1-15')).toBe(true);
    });
});

describe('useDateSelections - isYearActive / isMonthActive / isDayActive', () => {
    it('isYearActive retorna true con clave de año en selections', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleYearClick(2024));
        expect(result.current.isYearActive(2024)).toBe(true);
    });

    it('isYearActive retorna true si hay selecciones de meses del año', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleMonthClick(2024, 3));
        expect(result.current.isYearActive(2024)).toBe(true);
    });

    it('isYearActive retorna false si no hay nada del año', () => {
        const { result } = renderHook(() => useDateSelections());
        expect(result.current.isYearActive(2024)).toBe(false);
    });

    it('isMonthActive retorna true con clave de mes en selections', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleMonthClick(2024, 2));
        expect(result.current.isMonthActive(2024, 2)).toBe(true);
    });

    it('isMonthActive retorna true si hay días del mes seleccionados', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleDayClick(2024, 2, 10));
        expect(result.current.isMonthActive(2024, 2)).toBe(true);
    });

    it('isDayActive retorna true para el día seleccionado', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleDayClick(2024, 1, 5));
        expect(result.current.isDayActive(2024, 1, 5)).toBe(true);
    });

    it('isDayActive retorna false para un día no seleccionado', () => {
        const { result } = renderHook(() => useDateSelections());
        expect(result.current.isDayActive(2024, 1, 5)).toBe(false);
    });
});

describe('useDateSelections - clearAllSelections', () => {
    it('limpia todas las selecciones', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.handleYearClick(2024));
        act(() => result.current.clearAllSelections());
        expect(result.current.selections.size).toBe(0);
    });

    it('resetea expandedYear y expandedMonth', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.toggleYear(2024, { '1': [], '2': [] }));
        act(() => result.current.clearAllSelections());
        expect(result.current.expandedYear).toBeNull();
        expect(result.current.expandedMonth).toBeNull();
    });
});

describe('useDateSelections - toggleYear', () => {
    it('expande el año si no está seleccionado ni expandido', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.toggleYear(2024, { '1': [], '2': [] }));
        expect(result.current.expandedYear).toBe(2024);
    });

    it('colapsa el año si ya está expandido', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.toggleYear(2024, { '1': [], '2': [] }));
        act(() => result.current.toggleYear(2024, { '1': [], '2': [] }));
        expect(result.current.expandedYear).toBeNull();
    });

    it('deselecciona el año y sus meses si estaba seleccionado', () => {
        const initial = new Set(['2024-1', '2024-2']);
        const { result } = renderHook(() => useDateSelections(initial));
        act(() => result.current.toggleYear(2024, { '1': [], '2': [] }));
        expect(result.current.selections.has('2024-1')).toBe(false);
        expect(result.current.selections.has('2024-2')).toBe(false);
    });

    it('expande directamente el mes si el año tiene un solo mes', () => {
        const { result } = renderHook(() => useDateSelections());
        act(() => result.current.toggleYear(2024, { '3': [] }));
        expect(result.current.expandedMonth).toBe('2024-3');
    });
});
