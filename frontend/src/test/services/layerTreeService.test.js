import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchLayerTree,
    fetchInitialOrder,
    searchLayersRemote,
    clearLayerTreeCache,
} from '@services/layerTreeService';

const mockResponse = (body, { status = 200, headers = {} } = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
        get: (name) => headers[name.toLowerCase()] || headers[name] || null,
    },
    json: async () => body,
});

describe('layerTreeService', () => {
    beforeEach(() => {
        clearLayerTreeCache();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        clearLayerTreeCache();
    });

    describe('fetchLayerTree', () => {
        it('fetches tree on first call and caches response', async () => {
            const tree = [{ id: 'tema1', children: [] }];
            global.fetch.mockResolvedValueOnce(
                mockResponse(tree, { headers: { etag: 'W/"abc"' } })
            );

            const result = await fetchLayerTree();

            expect(result.tree).toEqual(tree);
            expect(result.etag).toBe('W/"abc"');
            expect(result.fromCache).toBe(false);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('returns cached tree on subsequent calls', async () => {
            const tree = [{ id: 'tema1', children: [] }];
            global.fetch.mockResolvedValueOnce(
                mockResponse(tree, { headers: { etag: 'W/"abc"' } })
            );

            await fetchLayerTree();
            const second = await fetchLayerTree();

            expect(second.fromCache).toBe(true);
            expect(second.tree).toEqual(tree);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('sends If-None-Match and returns cached on 304', async () => {
            const tree = [{ id: 'tema1', children: [] }];
            global.fetch.mockResolvedValueOnce(
                mockResponse(tree, { headers: { etag: 'W/"abc"' } })
            );
            await fetchLayerTree();

            global.fetch.mockResolvedValueOnce(
                mockResponse(null, { status: 304, headers: { etag: 'W/"abc"' } })
            );
            const result = await fetchLayerTree({ force: true });

            const secondCall = global.fetch.mock.calls[1];
            expect(secondCall[1].headers['If-None-Match']).toBe('W/"abc"');
            expect(result.fromCache).toBe(true);
            expect(result.tree).toEqual(tree);
        });

        it('throws on non-304 error response', async () => {
            global.fetch.mockResolvedValueOnce(mockResponse(null, { status: 500 }));
            await expect(fetchLayerTree()).rejects.toThrow(/fallo 500/);
        });

        it('deduplicates concurrent in-flight requests', async () => {
            const tree = [{ id: 'tema1', children: [] }];
            let resolve;
            const pending = new Promise((r) => { resolve = r; });
            global.fetch.mockReturnValueOnce(pending);

            const p1 = fetchLayerTree();
            const p2 = fetchLayerTree();

            resolve(mockResponse(tree, { headers: { etag: 'W/"abc"' } }));
            const [r1, r2] = await Promise.all([p1, p2]);

            expect(r1).toEqual(r2);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('fetchInitialOrder', () => {
        it('fetches and caches initial order', async () => {
            global.fetch.mockResolvedValueOnce(mockResponse(['a', 'b', 'c']));

            const first = await fetchInitialOrder();
            const second = await fetchInitialOrder();

            expect(first).toEqual(['a', 'b', 'c']);
            expect(second).toEqual(['a', 'b', 'c']);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('searchLayersRemote', () => {
        it('returns empty for blank query without hitting network', async () => {
            const result = await searchLayersRemote('');
            expect(result).toEqual([]);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('calls endpoint with encoded query', async () => {
            global.fetch.mockResolvedValueOnce(
                mockResponse([{ id: 'a', label: 'A' }])
            );
            await searchLayersRemote('agua pozo', 20);

            const url = global.fetch.mock.calls[0][0];
            expect(url).toContain('/layers/search');
            expect(url).toContain('q=agua%20pozo');
            expect(url).toContain('limit=20');
        });
    });
});
