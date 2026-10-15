import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCapaPeriodicidad } from '@services/catalogoService';
import { dateColumnOf } from '@services/layerMetadataService';

const CAPA = { slug: 'tormentas', geoserverWorkspace: 'clima', geoserverLayer: 'tormentas' };

afterEach(() => vi.unstubAllGlobals());

describe('fetchCapaPeriodicidad', () => {
    it('registra la columna de fecha de la capa por su slug', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ periodicity: { 2024: { 3: [5] } }, column: 'obs_fecha' }),
        }));
        const periodicidad = await fetchCapaPeriodicidad(CAPA);
        expect(periodicidad).toEqual({ 2024: { 3: [5] } });
        expect(dateColumnOf('tormentas')).toBe('obs_fecha');
    });
});
