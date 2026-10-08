import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnnotationsPersistence } from '@pages/maps/hooks/useAnnotationsPersistence';

const opcionesDeDibujo = vi.fn();
vi.mock('@hooksMaps/useMapDrawing', () => ({
    useMapDrawing: (...args) => {
        opcionesDeDibujo(args[3]);
        return { measurements: [] };
    },
}));

const { useMedicionesDelCatalogo, CATALOGO_ANNOTATIONS_KEY } = await import('@pages/catalogo/hooks/useMedicionesDelCatalogo');

const TRAZO = JSON.stringify([{ type: 'LineString', coordinates: [[0, 0], [1, 1]] }]);

describe('las mediciones del catálogo viven solo mientras se está en él', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        opcionesDeDibujo.mockClear();
    });

    it('guarda en la sesión con su propia llave', () => {
        renderHook(() => useMedicionesDelCatalogo({ current: null }, null));
        expect(opcionesDeDibujo).toHaveBeenCalledWith({ storageKey: CATALOGO_ANNOTATIONS_KEY, storageType: 'session' });
    });

    it('al salir del catálogo se borran', () => {
        sessionStorage.setItem(CATALOGO_ANNOTATIONS_KEY, TRAZO);
        const { unmount } = renderHook(() => useMedicionesDelCatalogo({ current: null }, null));
        expect(sessionStorage.getItem(CATALOGO_ANNOTATIONS_KEY)).toBe(TRAZO);
        unmount();
        expect(sessionStorage.getItem(CATALOGO_ANNOTATIONS_KEY)).toBeNull();
    });

    it('los trazos viejos del localStorage se descartan al entrar', () => {
        localStorage.setItem(CATALOGO_ANNOTATIONS_KEY, TRAZO);
        renderHook(() => useMedicionesDelCatalogo({ current: null }, null));
        expect(localStorage.getItem(CATALOGO_ANNOTATIONS_KEY)).toBeNull();
    });
});

describe('useAnnotationsPersistence con almacén de sesión', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('hidrata de la sesión y no del localStorage', () => {
        localStorage.setItem('llave', TRAZO);
        const restaurar = vi.fn();
        renderHook(() => useAnnotationsPersistence({ measurements: [], restoreAnnotations: restaurar, storageKey: 'llave', storageType: 'session' }));
        expect(restaurar).not.toHaveBeenCalled();
    });

    it('sin almacén indicado sigue usando el localStorage', () => {
        localStorage.setItem('llave', TRAZO);
        const restaurar = vi.fn();
        renderHook(() => useAnnotationsPersistence({ measurements: [], restoreAnnotations: restaurar, storageKey: 'llave' }));
        expect(restaurar).toHaveBeenCalledTimes(1);
    });
});
