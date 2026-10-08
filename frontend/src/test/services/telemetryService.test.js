import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const respuesta = (status, body = {}) => ({ ok: status < 400, status, json: async () => body });

const cargar = async () => {
    vi.resetModules();
    vi.stubEnv('VITE_APP_ENV', 'dev');
    const servicio = await import('@services/telemetryService');
    const { telemetryDebugStore } = await import('@services/telemetryDebugStore');
    return { ...servicio, telemetryDebugStore };
};

const nombresDe = (llamada) => JSON.parse(llamada[1].body).events.map(evento => evento.eventName);

describe('telemetryService ante un lote rechazado', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('descarta solo los eventos rechazados y reenvía el resto', async () => {
        const { enqueue, flushNow, telemetryDebugStore } = await cargar();
        fetch
            .mockResolvedValueOnce(respuesta(422, { detail: [{ loc: ['events', 2, 'eventName'] }] }))
            .mockResolvedValueOnce(respuesta(202, { ok: true }));

        enqueue('layer_toggle', { layer_id: 'a' });
        enqueue('evento_inexistente', {});
        await flushNow();
        await flushNow();

        expect(nombresDe(fetch.mock.calls[0])).toEqual(['session_start', 'layer_toggle', 'evento_inexistente']);
        expect(nombresDe(fetch.mock.calls[1])).toEqual(['session_start', 'layer_toggle']);

        const { porEvento, lotes } = telemetryDebugStore.getSnapshot();
        expect(porEvento.evento_inexistente.rechazados).toBe(1);
        expect(porEvento.layer_toggle.aceptados).toBe(1);
        expect(lotes[1].rechazados).toEqual(['evento_inexistente']);
    });

    it('un 4xx sin índices no se reintenta y cuenta como perdido', async () => {
        const { enqueue, flushNow, telemetryDebugStore } = await cargar();
        fetch.mockResolvedValue(respuesta(400));

        enqueue('layer_toggle', {});
        await flushNow();
        await flushNow();

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(telemetryDebugStore.getSnapshot().porEvento.layer_toggle.perdidos).toBe(1);
    });
});
