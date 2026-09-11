import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@hooks/useReportContext', () => ({
    useReportContext: () => () => ({ sourceContext: {} }),
}));

import { useColibriOpen } from '@hooks/useColibriOpen';

describe('useColibriOpen', () => {
    let widget;

    beforeEach(() => {
        widget = { openPanel: vi.fn(), setContext: vi.fn(), clearContext: vi.fn() };
        window.colibri = widget;
    });

    afterEach(() => {
        delete window.colibri;
    });

    it('pasa las opciones del panel al widget y avisa que abrio', () => {
        const { result } = renderHook(() => useColibriOpen());
        const abierto = result.current(
            { motivo: 'solicitud_api_key' },
            { tipoDefault: 'solicitud', tipos: 'solicitud', emailRequired: true },
        );
        expect(abierto).toBe(true);
        expect(widget.openPanel).toHaveBeenCalledWith(expect.objectContaining({
            tipoDefault: 'solicitud',
            tipos: 'solicitud',
            emailRequired: true,
        }));
        expect(widget.setContext).toHaveBeenCalledWith('motivo', 'solicitud_api_key');
    });

    it('sin opciones abre el panel generico, como antes', () => {
        const { result } = renderHook(() => useColibriOpen());
        result.current();
        const opciones = widget.openPanel.mock.calls[0][0];
        expect(opciones).not.toHaveProperty('tipoDefault');
    });

    it('devuelve false si el widget no esta cargado', () => {
        delete window.colibri;
        const { result } = renderHook(() => useColibriOpen());
        expect(result.current({ motivo: 'x' })).toBe(false);
    });
});
