import { describe, it, expect, vi } from 'vitest';
import { dibujarIcono, medidasDeIcono, tamanoPorEstilo, ESTILO_PUNTOS_3D_DEFAULT } from '@pages/maps/helpers/estilosDePuntos3d';

const ctx = () => ({
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(), ellipse: vi.fn(), drawImage: vi.fn(),
});

describe('estilos de puntos 3D', () => {
    it('el poste alarga el lienzo hacia abajo y la sombra un poco menos', () => {
        expect(medidasDeIcono(30, 30, 'frente')).toEqual({ ancho: 30, alto: 30 });
        expect(medidasDeIcono(30, 30, 'poste').alto).toBe(55);
        expect(medidasDeIcono(30, 30, 'sombra').alto).toBe(36);
        expect(medidasDeIcono(30, 30, 'poste', 2).alto).toBe(80);
    });

    it('dibuja poste o sombra ademas del icono, arriba del lienzo', () => {
        const conPoste = ctx();
        dibujarIcono(conPoste, 'img', 30, 30, 'poste');
        expect(conPoste.stroke).toHaveBeenCalled();
        expect(conPoste.drawImage).toHaveBeenCalledWith('img', 0, 0, 30, 30);
        const conSombra = ctx();
        dibujarIcono(conSombra, 'img', 30, 30, 'sombra');
        expect(conSombra.ellipse).toHaveBeenCalled();
        expect(conSombra.stroke).not.toHaveBeenCalled();
    });

    it('solo la sombra crece con el zoom y el poste es el recomendado', () => {
        expect(tamanoPorEstilo('poste')).toBe(1);
        expect(tamanoPorEstilo('sombra')[0]).toBe('interpolate');
        expect(ESTILO_PUNTOS_3D_DEFAULT).toBe('poste');
    });
});
