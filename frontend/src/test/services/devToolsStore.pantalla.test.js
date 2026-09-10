import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { escalaParaCaber, PANTALLAS } from '@constants/pantallas';

const cargarStore = async () => (await import('@services/devToolsStore')).devToolsStore;

describe('devToolsStore · simulador de pantallas', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('VITE_APP_ENV', 'dev');
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('guarda la pantalla elegida en la sesion y avisa a los suscriptores', async () => {
        const store = await cargarStore();
        const aviso = vi.fn();
        store.subscribe(aviso);
        store.setPantalla('movil');
        expect(store.getPantalla()).toBe('movil');
        expect(sessionStorage.getItem('devtools-pantalla')).toBe('movil');
        expect(aviso).toHaveBeenCalledTimes(1);
    });

    it('un valor que no es pantalla apaga el simulador', async () => {
        const store = await cargarStore();
        store.setPantalla('tablet');
        store.setPantalla('real');
        expect(store.getPantalla()).toBeNull();
        expect(sessionStorage.getItem('devtools-pantalla')).toBeNull();
    });

    it('al recargar sigue en la pantalla que se estaba simulando', async () => {
        sessionStorage.setItem('devtools-pantalla', 'laptop');
        const store = await cargarStore();
        expect(store.getPantalla()).toBe('laptop');
    });

    it('fuera de dev no se puede simular', async () => {
        vi.stubEnv('VITE_APP_ENV', 'beta');
        const store = await cargarStore();
        store.setPantalla('movil');
        expect(store.getPantalla()).toBeNull();
    });
});

describe('escalaParaCaber', () => {
    it('no agranda una pantalla que ya cabe', () => {
        expect(escalaParaCaber(PANTALLAS.movil, { ancho: 1400, alto: 900 })).toBe(1);
    });

    it('reduce lo justo para que el escritorio quepa completo', () => {
        const escala = escalaParaCaber(PANTALLAS.escritorio, { ancho: 1376, alto: 812 });
        expect(PANTALLAS.escritorio.ancho * escala).toBeLessThanOrEqual(1376);
        expect(PANTALLAS.escritorio.alto * escala).toBeLessThanOrEqual(812);
        expect(escala).toBeCloseTo(1376 / 1920, 5);
    });
});
