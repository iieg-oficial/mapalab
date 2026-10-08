import { describe, it, expect, beforeEach } from 'vitest';
import {
    borrarPropias, esPropia, formatoBytes, leerAlmacen, valorLegible,
} from '@services/storageDebug';

describe('storageDebug', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('lee las llaves de mayor a menor tamaño y marca las propias', () => {
        localStorage.setItem('mapalab.tabla.estado', JSON.stringify({ activo: true, porCapa: { a: 1 } }));
        localStorage.setItem('_ga', 'x');
        const entradas = leerAlmacen('local');
        expect(entradas.map(e => e.llave)).toEqual(['mapalab.tabla.estado', '_ga']);
        expect(entradas.map(e => e.propia)).toEqual([true, false]);
        expect(entradas[1].bytes).toBe(8);
    });

    it('borrarPropias respeta las ajenas y las de devtools', () => {
        sessionStorage.setItem('mapalab.telemetry.session', '{}');
        sessionStorage.setItem('mapalab:returnUrl', '/mapa');
        sessionStorage.setItem('devtools-analytics-panel', 'true');
        sessionStorage.setItem('colibri', '1');
        borrarPropias('session');
        expect(leerAlmacen('session').map(e => e.llave).sort()).toEqual(['colibri', 'devtools-analytics-panel']);
    });

    it('formatea JSON y deja el texto plano como está', () => {
        expect(valorLegible('{"a":1}')).toBe('{\n  "a": 1\n}');
        expect(valorLegible('horizontal')).toBe('horizontal');
    });

    it('reconoce los prefijos y formatea bytes', () => {
        expect(esPropia('mapalab:returnUrl')).toBe(true);
        expect(esPropia('devtools-pantalla')).toBe(true);
        expect(esPropia('_ga')).toBe(false);
        expect(formatoBytes(512)).toBe('512 B');
        expect(formatoBytes(3174)).toBe('3.1 KB');
    });
});
