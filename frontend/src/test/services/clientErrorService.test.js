import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportClientError } from '@services/clientErrorService';

describe('clientErrorService', () => {
    let beacon;

    beforeEach(() => {
        beacon = vi.fn(() => true);
        Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    });

    afterEach(() => {
        delete navigator.sendBeacon;
        window.history.replaceState(null, '', '/');
    });

    it('fuera del embed reporta a log/client-error', () => {
        window.history.replaceState(null, '', '/mapa');
        reportClientError({ type: 'chunk', message: 'fallo' });
        expect(beacon).toHaveBeenCalledTimes(1);
        expect(beacon.mock.calls[0][0]).toContain('log/client-error');
    });

    it('dentro del embed no reporta: ya lo cuenta /embed/telemetry', () => {
        window.history.replaceState(null, '', '/mapalab/embed');
        reportClientError({ type: 'chunk', message: 'fallo' });
        expect(beacon).not.toHaveBeenCalled();
    });
});
