import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NumeraliaPanelProvider, useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';

const ESTADO = 'mapalab.numeralia.estado';
const PROPIAS = 'mapalab.numeralia.personalizadas';

const montar = () => renderHook(() => useNumeraliaPanel(), { wrapper: NumeraliaPanelProvider });

const guardado = () => JSON.parse(localStorage.getItem(ESTADO) || 'null');

describe('estado persistente del panel', () => {
    beforeEach(() => localStorage.clear());

    it('arranca cerrado y en resumen', () => {
        const { result } = montar();
        expect(result.current.abierto).toBe(false);
        expect(result.current.modo).toBe('resumen');
        expect(result.current.clavesComparadas).toEqual([]);
    });

    it('guarda los municipios comparados', () => {
        const { result } = montar();
        act(() => result.current.compararCon(['14039', '14120']));
        expect(guardado().clavesComparadas).toEqual(['14039', '14120']);
    });

    it('no repite un municipio ya comparado', () => {
        const { result } = montar();
        act(() => result.current.compararCon(['14039']));
        act(() => result.current.compararCon(['14039', '14120']));
        expect(result.current.clavesComparadas).toEqual(['14039', '14120']);
    });

    it('topa la comparacion en seis municipios', () => {
        const { result } = montar();
        act(() => result.current.compararCon(['1', '2', '3', '4', '5', '6', '7', '8']));
        expect(result.current.clavesComparadas).toHaveLength(6);
    });

    it('recupera lo guardado al volver a montar', () => {
        const { result } = montar();
        act(() => result.current.detach('capa-a'));
        act(() => result.current.abrirModo('comparar'));
        act(() => result.current.compararCon(['14039']));

        const { result: segundo } = montar();
        expect(segundo.current.abierto).toBe(true);
        expect(segundo.current.modo).toBe('comparar');
        expect(segundo.current.clavesComparadas).toEqual(['14039']);
    });

    it('guarda el indicador del ranking por capa', () => {
        const { result } = montar();
        act(() => result.current.fijarRankingIndice('capa-a', 3));
        act(() => result.current.fijarRankingIndice('capa-b', 1));
        expect(result.current.rankingIndiceDe('capa-a')).toBe(3);
        expect(result.current.rankingIndiceDe('capa-b')).toBe(1);
        expect(result.current.rankingIndiceDe('capa-sin-uso')).toBe(0);
    });

    it('guarda el borrador por capa sin mezclarlos', () => {
        const { result } = montar();
        act(() => result.current.fijarBorrador('capa-a', { operation: 'sum', field: 'x', label: 'A', filters: [] }));
        expect(result.current.borradorDe('capa-a').label).toBe('A');
        expect(result.current.borradorDe('capa-b').label).toBe('');
        expect(result.current.borradorDe('capa-b').operation).toBe('count');
    });

    it('cerrar la herramienta borra el estado guardado', () => {
        const { result } = montar();
        act(() => result.current.detach('capa-a'));
        act(() => result.current.compararCon(['14039']));
        act(() => result.current.attach());

        expect(localStorage.getItem(ESTADO)).toBeNull();
        expect(result.current.abierto).toBe(false);
        expect(result.current.clavesComparadas).toEqual([]);
    });

    it('cerrar la herramienta NO borra las estadisticas guardadas', () => {
        const { result } = montar();
        act(() => result.current.agregarPersonalizada('capa-a', { operation: 'count', label: 'Mia', filters: [] }));
        act(() => result.current.attach());

        expect(result.current.personalizadasDe('capa-a')).toHaveLength(1);
        expect(JSON.parse(localStorage.getItem(PROPIAS))['capa-a']).toHaveLength(1);
    });

    it('las estadisticas propias no se mezclan entre capas', () => {
        const { result } = montar();
        act(() => result.current.agregarPersonalizada('capa-a', { label: 'A' }));
        act(() => result.current.agregarPersonalizada('capa-b', { label: 'B' }));
        expect(result.current.personalizadasDe('capa-a')).toEqual([{ label: 'A' }]);
        expect(result.current.personalizadasDe('capa-b')).toEqual([{ label: 'B' }]);
    });

    it('quita una propia por indice sin tocar las demas', () => {
        const { result } = montar();
        act(() => result.current.agregarPersonalizada('capa-a', { label: 'A' }));
        act(() => result.current.agregarPersonalizada('capa-a', { label: 'B' }));
        act(() => result.current.quitarPersonalizada('capa-a', 0));
        expect(result.current.personalizadasDe('capa-a')).toEqual([{ label: 'B' }]);
    });

    it('aguanta un localStorage corrupto', () => {
        localStorage.setItem(ESTADO, '{no es json');
        const { result } = montar();
        expect(result.current.modo).toBe('resumen');
        expect(result.current.clavesComparadas).toEqual([]);
    });
});
