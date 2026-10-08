import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createShare, fetchShare, pinShare } from '@services/shareService';

const mockResponse = ({ ok = true, status = 200, body = {} } = {}) => ({
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
});

beforeEach(() => {
    global.fetch = vi.fn();
});

describe('createShare', () => {
    it('hace POST a /shares y retorna el JSON', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ body: { id: 'abc' } }));
        const result = await createShare({ foo: 'bar' });
        expect(result).toEqual({ id: 'abc' });
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toContain('/shares');
        expect(options.method).toBe('POST');
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(options.body)).toEqual({ foo: 'bar' });
    });

    it('sin detalle del servidor lanza un mensaje generico', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 500, body: 'boom' }));
        await expect(createShare({})).rejects.toThrow('No se pudo crear el enlace');
    });

    it('muestra el detalle del servidor, como el techo de enlaces', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 429, body: { detail: 'Se alcanzó el límite de enlaces del sitio. Intenta en un minuto.' } }));
        await expect(createShare({})).rejects.toThrow('Se alcanzó el límite de enlaces del sitio');
    });
});

describe('fetchShare', () => {
    it('hace GET y retorna el JSON', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ body: { id: 'xyz' } }));
        const result = await fetchShare('xyz');
        expect(result).toEqual({ id: 'xyz' });
        expect(global.fetch.mock.calls[0][0]).toContain('/shares/xyz');
    });

    it('escapa el shareId', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ body: {} }));
        await fetchShare('a/b c');
        expect(global.fetch.mock.calls[0][0]).toContain(encodeURIComponent('a/b c'));
    });

    it('retorna null si la respuesta es 404', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 404 }));
        const result = await fetchShare('missing');
        expect(result).toBeNull();
    });

    it('lanza error en otros status no-ok', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 500 }));
        await expect(fetchShare('boom')).rejects.toThrow(/GET \/shares\/boom 500/);
    });
});

describe('pinShare', () => {
    it('hace POST a /pin y retorna el JSON', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ body: { pinned: true } }));
        const result = await pinShare('abc');
        expect(result).toEqual({ pinned: true });
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toContain('/shares/abc/pin');
        expect(options.method).toBe('POST');
    });

    it('lanza error si la respuesta no es ok', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 500 }));
        await expect(pinShare('abc')).rejects.toThrow(/POST \/shares\/abc\/pin 500/);
    });
});
