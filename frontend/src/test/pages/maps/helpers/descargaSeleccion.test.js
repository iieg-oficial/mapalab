import { describe, it, expect, vi } from 'vitest';
import { alPedirDescargaDeSeleccion, pedirDescargaDeSeleccion } from '@pages/maps/helpers/descargaSeleccion';

describe('descargaSeleccion', () => {
    it('avisa a quien esté escuchando y deja de hacerlo al soltarse', () => {
        const panel = vi.fn();
        const soltar = alPedirDescargaDeSeleccion(panel);

        pedirDescargaDeSeleccion();
        expect(panel).toHaveBeenCalledTimes(1);

        soltar();
        pedirDescargaDeSeleccion();
        expect(panel).toHaveBeenCalledTimes(1);
    });

    it('sin nadie escuchando no truena', () => {
        expect(() => pedirDescargaDeSeleccion()).not.toThrow();
    });
});
