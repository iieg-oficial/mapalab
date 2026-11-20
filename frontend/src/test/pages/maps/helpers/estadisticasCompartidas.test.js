import { describe, it, expect } from 'vitest';
import {
    leerEstadisticas,
    pedirEstadisticas,
    serializarEstadisticas,
    suscribirEstadisticas,
    tomarEstadisticas,
} from '@pages/maps/helpers/estadisticasCompartidas';

const slugDe = (id) => (id === 'capa-1' ? 'poblacion' : null);
const idDe = (slug) => (slug === 'poblacion' ? 'capa-1' : null);

describe('serializarEstadisticas', () => {
    it('guarda la capa del panel abierto y los municipios solo al comparar', () => {
        expect(serializarEstadisticas({ abierto: true, detachedLayerId: 'capa-1', modo: 'resumen', clavesComparadas: ['14039'] }, slugDe))
            .toEqual({ capa: 'poblacion' });
        expect(serializarEstadisticas({ abierto: true, detachedLayerId: 'capa-1', modo: 'comparar', clavesComparadas: ['14039', 'x'] }, slugDe))
            .toEqual({ capa: 'poblacion', modo: 'comparar', comparados: ['14039'] });
    });

    it('sin panel abierto o sin capa conocida no guarda nada', () => {
        expect(serializarEstadisticas({ abierto: false, detachedLayerId: 'capa-1' }, slugDe)).toBeNull();
        expect(serializarEstadisticas({ abierto: true, detachedLayerId: 'otra' }, slugDe)).toBeNull();
        expect(serializarEstadisticas(undefined, slugDe)).toBeNull();
    });
});

describe('leerEstadisticas', () => {
    it('resuelve la capa y sanea modo y municipios', () => {
        expect(leerEstadisticas({ capa: 'poblacion', modo: 'crear', comparados: ['120', '<x>'] }, idDe))
            .toEqual({ layerId: 'capa-1', modo: 'resumen', comparados: ['120'] });
    });

    it('una capa que no existe no abre el panel', () => {
        expect(leerEstadisticas({ capa: 'borrada' }, idDe)).toBeNull();
        expect(leerEstadisticas('poblacion', idDe)).toBeNull();
    });
});

describe('pendiente compartido', () => {
    it('avisa al pedir y se consume una sola vez', () => {
        let avisos = 0;
        const quitar = suscribirEstadisticas(() => { avisos += 1; });
        pedirEstadisticas({ layerId: 'capa-1' });
        quitar();
        expect(avisos).toBe(1);
        expect(tomarEstadisticas()).toEqual({ layerId: 'capa-1' });
        expect(tomarEstadisticas()).toBeNull();
    });
});
