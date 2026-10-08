import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectParentOrigin, isMessageFromParent, postReady } from './postMessage';

const padre = { postMessage: vi.fn() };

const simularIframe = (referrer) => {
    vi.spyOn(window, 'parent', 'get').mockReturnValue(padre);
    vi.spyOn(document, 'referrer', 'get').mockReturnValue(referrer);
};

afterEach(() => {
    vi.restoreAllMocks();
    padre.postMessage.mockClear();
});

describe('mensajes entre el embed y la página que lo contiene', () => {
    it('fuera de un iframe no hay origen del padre', () => {
        expect(detectParentOrigin()).toBeNull();
    });

    it('toma el origen del padre del referrer', () => {
        simularIframe('https://portal.ejemplo.mx/contacto?x=1');
        expect(detectParentOrigin()).toBe('https://portal.ejemplo.mx');
    });

    it('solo acepta mensajes del padre y con su origen', () => {
        simularIframe('https://portal.ejemplo.mx/');
        expect(isMessageFromParent({ source: padre, origin: 'https://portal.ejemplo.mx' })).toBe(true);
        expect(isMessageFromParent({ source: padre, origin: 'https://otro.mx' })).toBe(false);
        expect(isMessageFromParent({ source: {}, origin: 'https://portal.ejemplo.mx' })).toBe(false);
    });

    it('sin origen conocido rechaza todo', () => {
        simularIframe('');
        expect(isMessageFromParent({ source: padre, origin: 'https://portal.ejemplo.mx' })).toBe(false);
    });

    it('envía al origen del padre cuando lo conoce', () => {
        simularIframe('https://portal.ejemplo.mx/');
        postReady({ ok: true });
        expect(padre.postMessage).toHaveBeenCalledWith({ type: 'mapalab:ready', payload: { ok: true } }, 'https://portal.ejemplo.mx');
    });
});
