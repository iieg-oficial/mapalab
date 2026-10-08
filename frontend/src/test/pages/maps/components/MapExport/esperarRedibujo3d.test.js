import { describe, it, expect, vi } from 'vitest';
import { esperarRedibujo3d } from '@pages/maps/components/MapExport/utils/esperarRedibujo3d';

const mapa = (cargado) => {
    const oyentes = {};
    return {
        loaded: () => cargado,
        once: vi.fn((evento, fn) => { oyentes[evento] = fn; }),
        resize: vi.fn(),
        triggerRepaint: vi.fn(),
        emitir: (evento) => oyentes[evento]?.(),
    };
};

describe('esperarRedibujo3d', () => {
    it('redimensiona cada 3D y espera su idle aunque ya estuviera cargado', async () => {
        const alfa = mapa(true);
        const beta = mapa(true);
        let listo = false;
        const promesa = esperarRedibujo3d(new Set([alfa, beta])).then(() => { listo = true; });
        expect(alfa.resize).toHaveBeenCalled();
        expect(beta.triggerRepaint).toHaveBeenCalled();
        alfa.emitir('idle');
        await Promise.resolve();
        expect(listo).toBe(false);
        beta.emitir('idle');
        await promesa;
        expect(listo).toBe(true);
    });

    it('sin mapas resuelve de inmediato', async () => {
        await expect(esperarRedibujo3d([])).resolves.toEqual([]);
    });
});
