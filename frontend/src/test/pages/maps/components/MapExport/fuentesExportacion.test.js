import { describe, it, expect, vi } from 'vitest';
import { cargarFuentesDeExportacion } from '@pages/maps/components/MapExport/utils/fuentesExportacion';

describe('cargarFuentesDeExportacion', () => {
    it('pide los cuatro pesos de Garet antes de capturar', async () => {
        const fuentes = { load: vi.fn().mockResolvedValue([]), ready: Promise.resolve() };
        await cargarFuentesDeExportacion(fuentes);
        expect(fuentes.load.mock.calls.map(([f]) => f)).toEqual(['300 16px Garet', '400 16px Garet', '500 16px Garet', '700 16px Garet']);
    });

    it('si una fuente no carga, la descarga sigue', async () => {
        const fuentes = { load: vi.fn().mockRejectedValue(new Error('404')), ready: Promise.resolve() };
        await expect(cargarFuentesDeExportacion(fuentes)).resolves.toBeUndefined();
    });

    it('sin API de fuentes no hace nada', async () => {
        await expect(cargarFuentesDeExportacion(null)).resolves.toBeUndefined();
    });
});
