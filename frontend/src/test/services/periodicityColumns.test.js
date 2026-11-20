import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const LAYERS = [
    { id: 'lluvia', wmsConfig: { workspace: 'clima', layerName: 'clima:lluvia' } },
    { id: 'tormentas', wmsConfig: { workspace: 'tormentas', layerName: 'tormentas:obs' } },
];

const respond = (body, ok = true) => Promise.resolve({ ok, status: ok ? 200 : 404, json: () => Promise.resolve(body) });

let service;

beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_BACKEND_API_HOST', '/api/');
    service = await import('@services/layerMetadataService');
    service.setLayersForMetadataService(LAYERS);
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe('dateColumnOf', () => {
    it('toma la columna que manda el backend junto con la periodicidad en lote', async () => {
        vi.stubGlobal('fetch', vi.fn((url) => (String(url).includes('/periodicity/columns')
            ? respond({ 'tormentas:obs': 'obs_dateti', 'clima:lluvia': 'fecha' })
            : respond({ 'clima:lluvia': { 2024: { 1: [5] } }, 'tormentas:obs': { 1990: { 7: [22] } } }))));
        expect(service.dateColumnOf('tormentas')).toBe('fecha');
        const result = await service.getLayersPeriodicities(['lluvia', 'tormentas']);
        expect(Object.keys(result)).toEqual(['lluvia', 'tormentas']);
        expect(service.dateColumnOf('tormentas')).toBe('obs_dateti');
        expect(service.dateColumnOf('lluvia')).toBe('fecha');
    });

    it('sigue funcionando con un backend sin /periodicity/columns', async () => {
        vi.stubGlobal('fetch', vi.fn((url) => (String(url).includes('/periodicity/columns')
            ? respond({}, false)
            : respond({ 'tormentas:obs': { 1990: { 7: [22] } } }))));
        const result = await service.getLayersPeriodicities(['tormentas']);
        expect(result.tormentas).toEqual({ 1990: { 7: [22] } });
        expect(service.dateColumnOf('tormentas')).toBe('fecha');
    });

    it('la toma también de la periodicidad de una sola capa', async () => {
        vi.stubGlobal('fetch', vi.fn(() => respond({ periodicity: { 1990: { 7: [22] } }, column: 'obs_dateti' })));
        await service.getLayerPeriodicity('tormentas');
        expect(service.dateColumnOf('tormentas')).toBe('obs_dateti');
    });
});
