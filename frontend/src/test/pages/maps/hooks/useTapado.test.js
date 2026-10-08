import { describe, expect, it } from 'vitest';
import { estaTapado } from '@pages/maps/hooks/useTapado';

const caja = (left, top, right, bottom) => ({ left, top, right, bottom, width: right - left, height: bottom - top });

describe('estaTapado', () => {
    const minimapa = caja(80, 500, 256, 700);

    it('detecta un panel que se le encima y deja pasar los que no', () => {
        expect(estaTapado(minimapa, [caja(200, 600, 900, 800)])).toBe(true);
        expect(estaTapado(minimapa, [caja(300, 600, 900, 800)])).toBe(false);
        expect(estaTapado(minimapa, [caja(0, 0, 400, 400)])).toBe(false);
    });

    it('ignora nodos sin tamaño', () => {
        expect(estaTapado(minimapa, [caja(100, 550, 100, 550)])).toBe(false);
    });
});
