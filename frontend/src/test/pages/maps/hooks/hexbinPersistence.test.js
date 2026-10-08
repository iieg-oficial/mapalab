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

describe('lo que sobrevive al F5 además del modo', () => {
    const serializar = (id, sinFondo) => {
        const entry = { slug: id, visible: true, opacity: 1, filters: {} };
        if (sinFondo?.has?.(id)) entry.fill = false;
        return entry;
    };

    it('guarda fill solo cuando la capa lo tiene apagado', () => {
        const sinFondo = new Set(['unidades_salud']);
        expect(serializar('unidades_salud', sinFondo).fill).toBe(false);
        expect(serializar('otra', sinFondo).fill).toBeUndefined();
    });

    it('el modo de aislar viaja a nivel de mapa, no por capa', () => {
        const payload = { layers: [serializar('a')], soloSeleccionada: true };
        const revivido = JSON.parse(JSON.stringify(payload));
        expect(revivido.soloSeleccionada).toBe(true);
        expect(revivido.layers[0].soloSeleccionada).toBeUndefined();
    });

    it('un envelope viejo sin esos campos no los inventa', () => {
        const revivido = JSON.parse(JSON.stringify({ layers: [serializar('a')] }));
        expect(revivido.soloSeleccionada).toBeUndefined();
        expect(revivido.layers[0].fill).toBeUndefined();
    });
});

describe('el tono de la capa sobrevive al F5', () => {
    const serializar = (id, service, tono) => {
        const entry = { slug: id, visible: true, opacity: 1, filters: {} };
        if (service) entry.service = service;
        if (service && Number.isInteger(tono)) entry.palette = tono;
        return entry;
    };

    it('guarda el tono junto al modo', () => {
        expect(serializar('a', 'hexbin', 3).palette).toBe(3);
    });

    it('guarda el tono 0, que es un índice válido', () => {
        expect(serializar('a', 'hexbin', 0).palette).toBe(0);
    });

    it('no guarda tono si la capa no está agregada', () => {
        expect(serializar('a', null, 2).palette).toBeUndefined();
    });

    it('sobrevive al viaje por JSON', () => {
        const revivido = JSON.parse(JSON.stringify(serializar('a', 'hexbin', 4)));
        expect(revivido.palette).toBe(4);
    });
});
