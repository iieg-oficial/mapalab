import { describe, it, expect, beforeEach } from 'vitest';
import { ESTADO_INICIAL, guardarEstado, leerEstado } from '@pages/maps/helpers/tablaPersistencia';

describe('tablaPersistencia', () => {
    beforeEach(() => localStorage.clear());

    it('sin nada guardado devuelve el estado inicial', () => {
        expect(leerEstado()).toEqual(ESTADO_INICIAL);
    });

    it('conserva el acople, el alto y el estado por capa', () => {
        guardarEstado({
            activo: true,
            activaId: 'escuelas',
            acople: 'abajo',
            altoAcople: 320,
            porCapa: { escuelas: { seleccion: ['escuelas.1'], ocultas: ['cve'] } },
        });

        const leido = leerEstado();
        expect(leido.acople).toBe('abajo');
        expect(leido.altoAcople).toBe(320);
        expect(leido.porCapa.escuelas.seleccion).toEqual(['escuelas.1']);
        expect(leido.porCapa.escuelas.ocultas).toEqual(['cve']);
    });

    it('recuerda el modo del sider previo al fijar', () => {
        guardarEstado({ acople: 'abajo', modoPrevioSider: 'collapsed' });
        expect(leerEstado().modoPrevioSider).toBe('collapsed');
    });

    it('descarta lo guardado con otra version', () => {
        localStorage.setItem('mapalab.tabla.estado', JSON.stringify({ version: 99, estado: { acople: 'abajo' } }));
        expect(leerEstado()).toEqual(ESTADO_INICIAL);
    });

    it('no truena con contenido corrupto', () => {
        localStorage.setItem('mapalab.tabla.estado', 'no soy json');
        expect(leerEstado()).toEqual(ESTADO_INICIAL);
    });
});
