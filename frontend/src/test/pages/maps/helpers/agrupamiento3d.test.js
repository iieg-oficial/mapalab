import { describe, it, expect } from 'vitest';
import { OPCIONES_AGRUPAR, SIN_GRUPO, capaDeGrupos, medidaDeGrupo } from '@pages/maps/helpers/agrupamiento3d';
import { tamanoPorEstilo } from '@pages/maps/helpers/estilosDePuntos3d';
import { escalarMarcador } from '@pages/maps/hooks/useAnotacionesPuntuales3d';

describe('agrupar y escalar en 3D', () => {
    it('la capa de grupos pinta la cuenta y los iconos sueltos excluyen los grupos', () => {
        const capa = capaDeGrupos('pt-salud', 1.2);
        expect(capa.filter).toEqual(['has', 'point_count']);
        expect(capa.layout['icon-image']).toEqual(['concat', 'cuenta:', ['get', 'point_count_abbreviated']]);
        expect(capa.layout['icon-size']).toBe(1.2);
        expect(SIN_GRUPO).toEqual(['!', ['has', 'point_count']]);
        expect(OPCIONES_AGRUPAR.cluster).toBe(true);
        expect(medidaDeGrupo('1.2k')).toBeGreaterThan(medidaDeGrupo('7'));
    });

    it('el tamano escala con la sombra dentro de la interpolacion por zoom', () => {
        expect(tamanoPorEstilo('poste', 1.3)).toBe(1.3);
        expect(tamanoPorEstilo('sombra', 2)).toEqual(['interpolate', ['linear'], ['zoom'], 6, 1.8, 13, 3]);
    });

    it('el marcador escalado conserva su contenido y crece desde su ancla', () => {
        const raiz = document.createElement('div');
        raiz.innerHTML = '<span>🌮</span><div></div>';
        const { elemento, anchor } = escalarMarcador({ elemento: raiz, anchor: 'bottom', offset: [0, 0] }, 1.5);
        expect(anchor).toBe('bottom');
        expect(elemento.children).toHaveLength(1);
        expect(elemento.firstElementChild.style.transform).toBe('scale(1.5)');
        expect(elemento.firstElementChild.style.transformOrigin).toBe('bottom center');
        expect(elemento.textContent).toBe('🌮');
    });
});
