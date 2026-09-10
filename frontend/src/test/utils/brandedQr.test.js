import { describe, it, expect } from 'vitest';
import { opcionesQr, QR_DESCARGA } from '@utils/brandedQr';

describe('opcionesQr', () => {
    it('lleva el enlace, el tamaño pedido y correccion alta para el logo', () => {
        const opciones = opcionesQr('https://ejemplo.mx/mapa?s=abc', 112);
        expect(opciones.data).toBe('https://ejemplo.mx/mapa?s=abc');
        expect(opciones.width).toBe(112);
        expect(opciones.height).toBe(112);
        expect(opciones.qrOptions.errorCorrectionLevel).toBe('H');
    });

    it('usa los colores de la marca', () => {
        const opciones = opcionesQr('x', 200);
        expect(opciones.dotsOptions.color).toBe('#5C2472');
        expect(opciones.cornersSquareOptions.color).toBe('#703088');
    });

    it('la descarga sale a 800 px', () => {
        expect(QR_DESCARGA).toBe(800);
    });
});
