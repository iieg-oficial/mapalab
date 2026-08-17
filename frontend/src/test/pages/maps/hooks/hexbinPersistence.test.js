import { describe, it, expect } from 'vitest';
import { SERVICE_HEXBIN, SERVICE_WMS } from '@pages/maps/helpers/serviceMode';

const serializeLayer = (id, modes) => {
    const mode = modes instanceof Map ? modes.get(id) : modes?.[id];
    const entry = { slug: id, visible: true, opacity: 1, filters: {} };
    if (mode && mode !== SERVICE_WMS) entry.service = mode;
    return entry;
};

describe('el modo hexágonos viaja en el envelope de la sesión', () => {
    it('escribe service solo cuando difiere del default', () => {
        const modes = new Map([['unidades_salud', SERVICE_HEXBIN]]);

        expect(serializeLayer('unidades_salud', modes).service).toBe(SERVICE_HEXBIN);
        expect(serializeLayer('otra_capa', modes).service).toBeUndefined();
    });

    it('sobrevive al viaje por JSON, que es lo que hace el storage', () => {
        const modes = new Map([['unidades_salud', SERVICE_HEXBIN]]);
        const envelope = { version: 2, kind: 'single', payload: { layers: [serializeLayer('unidades_salud', modes)] } };

        const revivido = JSON.parse(JSON.stringify(envelope));

        expect(revivido.payload.layers[0].service).toBe(SERVICE_HEXBIN);
        expect(revivido.payload.layers[0].slug).toBe('unidades_salud');
    });

    it('un envelope viejo sin service no rompe nada', () => {
        const entry = { slug: 'unidades_salud', visible: true, opacity: 1, filters: {} };
        const revivido = JSON.parse(JSON.stringify(entry));
        expect(revivido.service).toBeUndefined();
    });
});
