import { describe, it, expect, vi } from 'vitest';
import { sincronizar } from '@pages/maps/hooks/useCamara3dSincronizada';

const mapa = (camara) => {
    const m = {
        camara,
        getCenter: () => m.camara.center,
        getZoom: () => m.camara.zoom,
        getBearing: () => m.camara.bearing,
        getPitch: () => m.camara.pitch,
        jumpTo: vi.fn((c) => { m.camara = c; }),
    };
    return m;
};

describe('sincronizar', () => {
    it('copia la camara del origen a los demas y no rebota', () => {
        const a = mapa({ center: [-103, 20], zoom: 9, bearing: 30, pitch: 55 });
        const b = mapa({ center: [0, 0], zoom: 1, bearing: 0, pitch: 0 });
        const grupo = { miembros: new Set([a, b]), fuente: null };
        b.jumpTo.mockImplementation((c) => { b.camara = c; sincronizar(grupo, b); });
        sincronizar(grupo, a);
        expect(b.camara).toEqual(a.camara);
        expect(a.jumpTo).not.toHaveBeenCalled();
        expect(grupo.fuente).toBeNull();
    });
});
