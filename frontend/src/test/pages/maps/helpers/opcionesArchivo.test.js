import { describe, expect, it } from 'vitest';
import { elegible, opcionesDeArchivo } from '@pages/maps/helpers/grabacion/opcionesArchivo';

describe('formatos de la grabación', () => {
    it('ofrece MP4, WebM y GIF, y apaga los que el navegador no puede generar', () => {
        const opciones = opcionesDeArchivo({ mp4: false, webm: true });
        expect(opciones.map(o => o.value)).toEqual(['mp4', 'webm', 'gif']);
        expect(opciones[0].disabled).toBe(true);
        expect(opciones[1].disabled).toBe(false);
    });

    it('el REC del dron no lleva GIF', () => {
        expect(opcionesDeArchivo({ mp4: true, webm: true }, { gif: false }).map(o => o.value)).toEqual(['mp4', 'webm']);
    });

    it('si el formato elegido no se puede, cae al primero disponible', () => {
        const opciones = opcionesDeArchivo({ mp4: false, webm: true });
        expect(elegible(opciones, 'mp4')).toBe('webm');
        expect(elegible(opciones, 'gif')).toBe('gif');
    });
});
