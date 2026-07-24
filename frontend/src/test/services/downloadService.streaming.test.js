import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_BACKEND_API_HOST', 'http://api.test');

const testLayers = [
    {
        id: 'single-vec',
        label: 'Capa Sola',
        wmsConfig: { workspace: 'salud', baseUrl: 'http://geo.test/geoserver/salud/wms', layerName: 'salud:hospitales' }
    }
];

const findById = (id, arr) => arr.find(l => l.id === id) || null;
const findWMS = (id, arr) => (arr.find(l => l.id === id && l.wmsConfig)?.wmsConfig) || null;

vi.mock('@pages/maps/helpers/layers/utils/layerHelpers', () => ({
    findLayerById: (id, arr) => findById(id, arr && arr.length ? arr : testLayers),
    collectLayersWithWMS: () => []
}));

vi.mock('@pages/maps/helpers/wmsConfig', () => ({
    findWMSConfig: (id, arr) => findWMS(id, arr && arr.length ? arr : testLayers),
    hydrateWmsConfig: () => null
}));

const mockBlob = new Blob(['data']);
let clickedLink = null;

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    clickedLink = null;
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { clickedLink = el; });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    delete window.showSaveFilePicker;
});

const { downloadSingleFormat } = await import('@services/downloadService');

describe('streaming a disco (File System Access API)', () => {
    let writtenChunks;
    let closed;

    const streamResponse = () => Promise.resolve({
        ok: true,
        headers: { get: (h) => (h === 'content-type' ? 'text/csv' : null) },
        blob: () => Promise.resolve(mockBlob),
        body: {
            getReader: () => {
                let done = false;
                return {
                    read: async () => {
                        if (done) return { done: true };
                        done = true;
                        return { done: false, value: new Uint8Array([1, 2, 3]) };
                    },
                };
            },
        },
    });

    const stubPicker = (impl) => {
        window.showSaveFilePicker = impl || vi.fn(async ({ suggestedName }) => ({
            _name: suggestedName,
            createWritable: async () => ({
                write: async (chunk) => { writtenChunks.push(chunk); },
                close: async () => { closed = true; },
                abort: async () => {},
            }),
        }));
    };

    beforeEach(() => {
        writtenChunks = [];
        closed = false;
        global.fetch = vi.fn(streamResponse);
    });

    it('escribe a disco vía writable en lugar de disparar un <a download>', async () => {
        stubPicker();
        const result = await downloadSingleFormat('single-vec', 'csv', { onProgress: vi.fn() });
        expect(result.success).toBe(true);
        expect(window.showSaveFilePicker).toHaveBeenCalledWith(
            expect.objectContaining({ suggestedName: expect.stringMatching(/Capa_Sola_.*\.csv/) })
        );
        expect(writtenChunks.length).toBeGreaterThan(0);
        expect(closed).toBe(true);
        expect(clickedLink).toBeNull();
    });

    it('reporta cancelado si el usuario cierra el diálogo de guardar', async () => {
        const abortError = new Error('user abort');
        abortError.name = 'AbortError';
        stubPicker(vi.fn().mockRejectedValue(abortError));
        const result = await downloadSingleFormat('single-vec', 'csv');
        expect(result.cancelled).toBe(true);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('cae al flujo blob si el picker falla por permisos', async () => {
        const secErr = new Error('not allowed');
        secErr.name = 'SecurityError';
        stubPicker(vi.fn().mockRejectedValue(secErr));
        const result = await downloadSingleFormat('single-vec', 'csv');
        expect(result.success).toBe(true);
        expect(clickedLink).not.toBeNull();
    });
});
