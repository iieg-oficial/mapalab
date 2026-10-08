import { describe, it, expect, vi } from 'vitest';
import { marcarEn3d } from '@pages/maps/hooks/useMiUbicacion';

const mapa = () => {
    const fuentes = {};
    return {
        getSource: (id) => fuentes[id],
        addSource: vi.fn((id) => { fuentes[id] = { setData: vi.fn() }; }),
        addLayer: vi.fn(),
    };
};

describe('marcarEn3d', () => {
    it('crea la fuente una vez y despues solo mueve el punto', () => {
        const m = mapa();
        marcarEn3d(m, [-103.3, 20.6]);
        marcarEn3d(m, [-103.4, 20.7]);
        expect(m.addSource).toHaveBeenCalledTimes(1);
        expect(m.addLayer).toHaveBeenCalledTimes(1);
        expect(m.getSource('mi-ubicacion').setData).toHaveBeenCalledWith(expect.objectContaining({ geometry: { type: 'Point', coordinates: [-103.4, 20.7] } }));
    });
});
