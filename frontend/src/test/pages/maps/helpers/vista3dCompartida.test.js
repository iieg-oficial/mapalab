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
        expect(vista).toEqual({ pitch: 80, bearing: 30, exaggeration: 1, extruded: ['a'], ajustes: null });
        expect(leerVista3d(null, () => null)).toBeNull();
    });

    it('comparte solo los ajustes distintos a los de fabrica y los normaliza al leer', () => {
        const view3d = { active: true, pitch: 55, bearing: 0, exaggeration: 1.5, extruded: [], ajustes: { estiloPuntos: 'poste', escalaSimbolos: 1.2, terreno: true } };
        const vista = serializarVista3d(view3d, id => id);
        expect(vista.ajustes).toEqual({ estiloPuntos: 'poste', escalaSimbolos: 1.2 });
        const leida = leerVista3d({ ...vista, ajustes: { ...vista.ajustes, velocidadOrbita: 99, estiloTextos: 'raro' } }, id => id);
        expect(leida.ajustes).toMatchObject({ estiloPuntos: 'poste', escalaSimbolos: 1.2, velocidadOrbita: 20, estiloTextos: 'frente', terreno: true });
    });

    it('sin ajustes cambiados el enlace no los lleva', () => {
        expect(serializarVista3d({ active: true, pitch: 55, bearing: 0, exaggeration: 1.5, extruded: [], ajustes: {} }, id => id)).not.toHaveProperty('ajustes');
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
