import { describe, expect, it } from 'vitest';
import { indicadoresDeGiro, nombreDeArchivo, planDeGiro, rumboDelCuadro } from '@pages/maps/helpers/grabacion/planGiro';
import { opcionesFormato } from '@mapsComponents/MapExport/utils/opcionesDescarga';

describe('plan de la vuelta grabada', () => {
    it('el GIF dura 3 o 5 s a 15 cuadros por segundo y sale cuadrado', () => {
        expect(planDeGiro({ tipo: 'gif', segundosGif: 5 })).toMatchObject({ fps: 15, segundos: 5, cuadros: 75, ancho: 480, alto: 480 });
    });

    it('el video dura una vuelta a la velocidad de la órbita, sin pasar de 30 s', () => {
        expect(planDeGiro({ tipo: 'video', calidad: '1080', velocidad: 20 })).toMatchObject({ fps: 30, segundos: 18, cuadros: 540, ancho: 1920, alto: 1080 });
        expect(planDeGiro({ tipo: 'video', calidad: '720', velocidad: 8 }).segundos).toBe(30);
    });

    it('los rumbos dan una vuelta completa sin repetir el primer cuadro', () => {
        expect(rumboDelCuadro(350, 0, 4)).toBe(350);
        expect(rumboDelCuadro(350, 1, 4)).toBe(80);
        expect(rumboDelCuadro(350, 3, 4)).toBe(260);
    });

    it('el archivo lleva la capa sin acentos y la fecha', () => {
        expect(nombreDeArchivo('Población total · 2020', new Date(2026, 8, 30))).toBe('mapalab_poblacion_total_2020_2026-09-30');
    });

    it('los indicadores del giro son rumbo, inclinación y zoom', () => {
        const [rumbo, inclinacion, zoom] = indicadoresDeGiro({ rumbo: 47, inclinacion: 60, zoom: 11.4 });
        expect(rumbo).toMatchObject({ tipo: 'brujula', rumbo: 47 });
        expect(inclinacion.valor).toBe('60°');
        expect(zoom.valor).toBe('11.4');
    });
});

describe('formato Animación', () => {
    it('solo aparece en 3D y en el comparador queda apagado', () => {
        expect(opcionesFormato(false).some(o => o.value === 'animacion')).toBe(false);
        expect(opcionesFormato(false, true).find(o => o.value === 'animacion').disabled).toBeUndefined();
        expect(opcionesFormato(true, true).find(o => o.value === 'animacion').disabled).toBe(true);
    });
});
