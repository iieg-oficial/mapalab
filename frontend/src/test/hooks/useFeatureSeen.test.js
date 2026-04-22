import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeatureSeen } from '@hooks/useFeatureSeen';

const PREFIX = 'mapalab:feature-seen:';

beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
});

describe('useFeatureSeen', () => {
    it('inicia en false cuando no hay registro en localStorage', () => {
        const { result } = renderHook(() => useFeatureSeen('feature-a'));
        const [seen] = result.current;
        expect(seen).toBe(false);
    });

    it('inicia en true si el key ya está marcado como seen', () => {
        localStorage.setItem(`${PREFIX}feature-a`, 'true');
        const { result } = renderHook(() => useFeatureSeen('feature-a'));
        const [seen] = result.current;
        expect(seen).toBe(true);
    });

    it('markSeen actualiza el estado a true y persiste en localStorage', () => {
        const { result } = renderHook(() => useFeatureSeen('feature-b'));
        expect(result.current[0]).toBe(false);

        act(() => {
            result.current[1]();
        });

        expect(result.current[0]).toBe(true);
        expect(localStorage.getItem(`${PREFIX}feature-b`)).toBe('true');
    });

    it('cuando key es null, seen es false y markSeen es no-op', () => {
        const { result } = renderHook(() => useFeatureSeen(null));
        expect(result.current[0]).toBe(false);

        act(() => {
            result.current[1]();
        });

        expect(result.current[0]).toBe(false);
        expect(localStorage.length).toBe(0);
    });

    it('tolera errores de localStorage al leer (modo privado / quota)', () => {
        const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('privacy');
        });

        const { result } = renderHook(() => useFeatureSeen('feature-c'));
        expect(result.current[0]).toBe(false);
        spy.mockRestore();
    });

    it('tolera errores de localStorage al escribir sin crashear', () => {
        const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota');
        });

        const { result } = renderHook(() => useFeatureSeen('feature-d'));
        act(() => {
            result.current[1]();
        });

        expect(result.current[0]).toBe(true);
        spy.mockRestore();
    });

    it('keys distintos producen estados independientes', () => {
        localStorage.setItem(`${PREFIX}feat-1`, 'true');
        const { result: r1 } = renderHook(() => useFeatureSeen('feat-1'));
        const { result: r2 } = renderHook(() => useFeatureSeen('feat-2'));

        expect(r1.current[0]).toBe(true);
        expect(r2.current[0]).toBe(false);
    });
});
