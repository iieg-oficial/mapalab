import { describe, expect, it, vi } from 'vitest';
import { leerVista3d, pedirVista3d, serializarVista3d, suscribirVista3d, tomarVista3d } from '@pages/maps/helpers/vista3dCompartida';

describe('vista3dCompartida', () => {
    it('no serializa nada fuera de la vista 3D', () => {
        expect(serializarVista3d({ active: false, pitch: 55 }, id => id)).toBeNull();
    });

    it('serializa la cámara acotada y las capas extruidas por slug', () => {
        const vista = serializarVista3d(
            { active: true, pitch: 95.4, bearing: 350.26, exaggeration: 1.55, extruded: ['a', 'sin_slug', 'b'] },
            id => ({ a: 'ws:a', b: 'ws:b' })[id],
        );
        expect(vista).toEqual({ pitch: 80, bearing: -9.7, exaggeration: 1.6, extruir: ['ws:a', 'ws:b'] });
    });

    it('lee una vista compartida, acota valores y descarta capas que ya no existen', () => {
        const vista = leerVista3d({ pitch: 200, bearing: 30, exaggeration: 0, extruir: ['ws:a', 'ws:x'] }, slug => (slug === 'ws:a' ? 'a' : null));
        expect(vista).toEqual({ pitch: 80, bearing: 30, exaggeration: 1, extruded: ['a'] });
        expect(leerVista3d(null, () => null)).toBeNull();
    });

    it('entrega la vista pendiente una sola vez y avisa a los suscritos', () => {
        const oyente = vi.fn();
        const soltar = suscribirVista3d(oyente);
        pedirVista3d({ pitch: 40 });
        expect(oyente).toHaveBeenCalledTimes(1);
        expect(tomarVista3d()).toEqual({ pitch: 40 });
        expect(tomarVista3d()).toBeNull();
        soltar();
    });
});
