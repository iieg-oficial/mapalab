import { describe, it, expect } from 'vitest';
import { vistaCambio } from '@pages/maps/helpers/shareViewDrift';

const base = { lon: -103.3496, lat: 20.6597, zoom: 11 };

describe('vistaCambio', () => {
    it('la misma vista no cuenta como cambio', () => {
        expect(vistaCambio(base, { ...base })).toBe(false);
    });

    it('ignora el ruido de redondeo de la proyeccion', () => {
        expect(vistaCambio(base, { lon: base.lon + 0.00001, lat: base.lat - 0.00001, zoom: base.zoom + 0.001 })).toBe(false);
    });

    it('mover el mapa cuenta como cambio', () => {
        expect(vistaCambio(base, { ...base, lon: base.lon + 0.01 })).toBe(true);
        expect(vistaCambio(base, { ...base, lat: base.lat - 0.01 })).toBe(true);
    });

    it('acercar o alejar cuenta como cambio', () => {
        expect(vistaCambio(base, { ...base, zoom: 12 })).toBe(true);
    });

    it('sin vista de referencia no hay cambio que medir', () => {
        expect(vistaCambio(null, base)).toBe(false);
        expect(vistaCambio(base, null)).toBe(false);
    });
});
