import { describe, expect, it } from 'vitest';
import { nombreDeArchivo, planDeGiro } from '@pages/maps/helpers/grabacion/planGiro';
import { opcionesFormato, opcionesTipo } from '@mapsComponents/MapExport/utils/opcionesDescarga';

describe('plan de la vuelta grabada', () => {
    it('el GIF dura 3 o 5 s a 15 cuadros por segundo, cuadrado, tomados a lo largo de la vuelta', () => {
        expect(planDeGiro({ tipo: 'gif', segundosGif: 5, velocidad: 8 })).toMatchObject({ fps: 15, segundos: 5, cuadros: 75, duracionVuelta: 45, ancho: 480, alto: 480 });
    });

    it('el video dura lo que tarda la vuelta a la velocidad de la órbita', () => {
        expect(planDeGiro({ tipo: 'mp4', calidad: '1080', velocidad: 20 })).toMatchObject({ fps: 30, segundos: 18, ancho: 1920, alto: 1080 });
        expect(planDeGiro({ tipo: 'webm', calidad: '720', velocidad: 8 }).segundos).toBe(45);
    });

    it('el archivo lleva la capa sin acentos y la fecha', () => {
        expect(nombreDeArchivo('Población total · 2020', new Date(2026, 8, 30))).toBe('mapalab_poblacion_total_2020_2026-09-30');
    });
});

describe('qué descargar', () => {
    it('Imagen o Animación, y en el comparador la animación queda apagada', () => {
        expect(opcionesTipo(false).map(o => o.value)).toEqual(['imagen', 'animacion']);
        expect(opcionesTipo(false)[1].disabled).toBeUndefined();
        expect(opcionesTipo(true)[1].disabled).toBe(true);
        expect(opcionesFormato(false).some(o => o.value === 'animacion')).toBe(false);
    });
});
