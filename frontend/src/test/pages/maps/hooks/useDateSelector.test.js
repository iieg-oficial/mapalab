import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDateSelector } from '@hooksMaps/useDateSelector';

const MENSUAL = { 2023: { 12: null }, 2024: { 1: null, 6: null } };
const ANIO_2024 = "fecha >= '2024-01-01' AND fecha < '2025-01-01'";

const montar = (props) => {
    const onApply = vi.fn();
    const onClear = vi.fn();
    const hook = renderHook(
        (p) => useDateSelector({ fecha: MENSUAL, onApply, onClear, ...p }),
        { initialProps: props },
    );
    return { ...hook, onApply, onClear };
};

describe('useDateSelector con fecha por defecto de año completo', () => {
    it('marca los meses del año sin tocar el filtro aplicado', () => {
        const { result, onApply, onClear } = montar({ currentFilter: ANIO_2024 });
        expect(result.current.selectedYear).toBe(2024);
        expect([...result.current.selectedMonths]).toEqual([1, 6]);
        expect(onApply).not.toHaveBeenCalled();
        expect(onClear).not.toHaveBeenCalled();
    });

    it('marca el año cuando el filtro llega después de montar', () => {
        const { result, rerender, onApply, onClear } = montar({ currentFilter: null });
        rerender({ currentFilter: ANIO_2024 });
        expect(result.current.selectedYear).toBe(2024);
        expect([...result.current.selectedMonths]).toEqual([1, 6]);
        expect(onApply).not.toHaveBeenCalled();
        expect(onClear).not.toHaveBeenCalled();
    });

    it('en selección única se queda con el último mes del año', () => {
        const { result, onApply } = montar({ currentFilter: ANIO_2024, singleSelectOnly: true });
        expect([...result.current.selectedMonths]).toEqual([6]);
        expect(onApply).toHaveBeenCalledWith(expect.stringContaining('2024-06-01'), ['2024-6']);
    });
});
