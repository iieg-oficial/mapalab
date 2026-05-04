import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReporte } from '@services/feedbackService';

const mockResponse = ({ ok = true, status = 200, body = {}, headers = {} } = {}) => ({
    ok,
    status,
    headers: { get: (key) => headers[key.toLowerCase()] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body)
});

beforeEach(() => {
    global.fetch = vi.fn();
});

describe('submitReporte', () => {
    it('postea multipart/form-data con campos requeridos', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: 42 } }));
        const result = await submitReporte({
            tipo: 'bug',
            mensaje: 'test',
            sourceApp: 'mapalab',
            sourceRoute: '/mapa',
            sourceContext: { foo: 'bar' }
        });
        expect(result).toEqual({ id: 42 });
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toContain('/reportes');
        expect(options.method).toBe('POST');
        expect(options.body).toBeInstanceOf(FormData);
        expect(options.body.get('tipo')).toBe('bug');
        expect(options.body.get('mensaje')).toBe('test');
        expect(options.body.get('source_app')).toBe('mapalab');
        expect(options.body.get('source_route')).toBe('/mapa');
        expect(JSON.parse(options.body.get('source_context'))).toEqual({ foo: 'bar' });
        expect(options.body.get('website')).toBe('');
    });

    it('omite email y screenshot cuando no se pasan', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: 1 } }));
        await submitReporte({ tipo: 'duda', mensaje: 'hola' });
        const form = global.fetch.mock.calls[0][1].body;
        expect(form.get('email_contacto')).toBeNull();
        expect(form.get('screenshot')).toBeNull();
    });

    it('adjunta screenshot blob cuando se pasa', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ status: 201, body: { id: 7 } }));
        const blob = new Blob(['fake'], { type: 'image/png' });
        await submitReporte({ tipo: 'bug', mensaje: 'x', screenshotBlob: blob });
        const form = global.fetch.mock.calls[0][1].body;
        expect(form.get('screenshot')).toBeInstanceOf(Blob);
    });

    it('lanza error con code rate_limited al recibir 429', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 429, headers: { 'retry-after': '120' } }));
        await expect(submitReporte({ tipo: 'bug', mensaje: 'x' })).rejects.toMatchObject({
            code: 'rate_limited',
            retryAfter: 120
        });
    });

    it('lanza error genérico en otros status no-ok', async () => {
        global.fetch.mockResolvedValueOnce(mockResponse({ ok: false, status: 500 }));
        await expect(submitReporte({ tipo: 'bug', mensaje: 'x' })).rejects.toMatchObject({
            code: 'request_failed',
            status: 500
        });
    });
});
