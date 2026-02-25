import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const testLayers = [
    {
        id: 'grupo-vec',
        label: 'Grupo Vectorial',
        forceGroup: true,
        children: [
            {
                id: 'vec-1',
                label: 'Vectorial 1',
                wmsConfig: { workspace: 'economia', baseUrl: 'http://geo.test/geoserver/economia/wms', layerName: 'economia:empleo' }
            },
            {
                id: 'vec-2',
                label: 'Vectorial 2',
                wmsConfig: { workspace: 'economia', baseUrl: 'http://geo.test/geoserver/economia/wms', layerName: 'economia:desempleo' }
            }
        ]
    },
    {
        id: 'single-vec',
        label: 'Capa Sola',
        wmsConfig: { workspace: 'salud', baseUrl: 'http://geo.test/geoserver/salud/wms', layerName: 'salud:hospitales' }
    },
    {
        id: 'single-raster',
        label: 'Capa Raster',
        wmsConfig: { workspace: 'raster', baseUrl: 'http://geo.test/geoserver/raster/wms', layerName: 'raster:lluvia_2024', timeEnabled: true }
    },
    {
        id: 'grupo-raster',
        label: 'Grupo Raster',
        forceGroup: true,
        children: [
            {
                id: 'rast-1',
                label: 'Raster 1',
                wmsConfig: { workspace: 'raster', baseUrl: 'http://geo.test/geoserver/raster/wms', layerName: 'raster:temp_2024', timeEnabled: true }
            }
        ]
    },
    {
        id: 'wfs-disabled',
        label: 'Sin WFS',
        wmsConfig: { workspace: 'general', baseUrl: 'http://geo.test/geoserver/general/wms', layerName: 'general:curvas', wfsAvailable: false }
    }
];

const findById = (id, arr) => {
    for (const l of arr) {
        if (l.id === id) return l;
        if (l.children) { const f = findById(id, l.children); if (f) return f; }
    }
    return null;
};

const findWMS = (id, arr) => {
    for (const l of arr) {
        if (l.id === id && l.wmsConfig) return l.wmsConfig;
        if (l.children) { const f = findWMS(id, l.children); if (f) return f; }
    }
    return null;
};

const collectWMS = (layer) => {
    if (!layer) return [];
    const result = [];
    const traverse = (n) => { if (!n) return; if (n.wmsConfig) result.push(n); if (n.children) n.children.forEach(traverse); };
    traverse(layer);
    return result;
};

const { mockGetLayerMetadata, MockJSZip } = vi.hoisted(() => {
    const mockFile = vi.fn();
    const mockFolder = vi.fn(() => ({ file: vi.fn() }));
    const mockGenerateAsync = vi.fn(() => Promise.resolve(new Blob(['zip'])));

    class MockJSZip {
        constructor() {
            this.file = mockFile;
            this.folder = mockFolder;
            this.generateAsync = mockGenerateAsync;
        }
    }

    return {
        mockGetLayerMetadata: vi.fn(),
        MockJSZip
    };
});

vi.mock('@pages/maps/helpers/layers/index', () => ({
    layers: testLayers,
    findLayerById: (id, arr) => findById(id, arr || testLayers),
    collectLayersWithWMS: collectWMS
}));

vi.mock('@pages/maps/helpers/wmsConfig', () => ({
    findWMSConfig: (id, arr) => findWMS(id, arr || testLayers)
}));

vi.mock('@services/layerMetadataService', () => ({
    getLayerMetadata: (...args) => mockGetLayerMetadata(...args)
}));

vi.mock('jszip', () => ({ default: MockJSZip }));

const mockBlob = new Blob(['data']);
let clickedLink = null;

beforeEach(() => {
    mockGetLayerMetadata.mockReset();
    mockGetLayerMetadata.mockResolvedValue({
        metadato_txt: 'http://meta.test/doc.txt',
        metadato_xlsx: 'http://meta.test/doc.xlsx'
    });
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    clickedLink = null;

    global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            headers: { get: () => 'application/octet-stream' },
            blob: () => Promise.resolve(mockBlob)
        })
    );

    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();

    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { clickedLink = el; });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => { });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });
});

afterEach(() => {
    vi.restoreAllMocks();
});

const { isRasterLayer, downloadLayerBundle } = await import('@services/downloadService');

describe('isRasterLayer', () => {
    it('retorna true para workspace raster', () => {
        expect(isRasterLayer('single-raster')).toBe(true);
    });

    it('retorna false para workspace vectorial', () => {
        expect(isRasterLayer('single-vec')).toBe(false);
    });

    it('retorna false para ID inexistente', () => {
        expect(isRasterLayer('fantasma')).toBe(false);
    });
});

describe('downloadLayerBundle — vectorial individual', () => {
    it('descarga exitosamente', async () => {
        const result = await downloadLayerBundle('single-vec');
        expect(result.success).toBe(true);
    });

    it('llama a fetch con WFS para 4 formatos', async () => {
        await downloadLayerBundle('single-vec');
        const wfsCalls = global.fetch.mock.calls.filter(c => c[0].includes('WFS'));
        expect(wfsCalls).toHaveLength(4);
    });

    it('genera nombre de archivo con label y fecha', async () => {
        await downloadLayerBundle('single-vec');
        expect(clickedLink).not.toBeNull();
        expect(clickedLink.download).toMatch(/Capa_Sola_\d{4}-\d{2}-\d{2}\.zip/);
    });
});

describe('downloadLayerBundle — raster individual', () => {
    it('descarga exitosamente con WCS', async () => {
        const result = await downloadLayerBundle('single-raster');
        expect(result.success).toBe(true);
        const wcsCalls = global.fetch.mock.calls.filter(c => c[0].includes('GetCoverage'));
        expect(wcsCalls.length).toBeGreaterThan(0);
    });

    it('incluye SUBSET con timeValue si getFilter lo provee', async () => {
        const getFilter = vi.fn(() => '2024-03');
        await downloadLayerBundle('single-raster', { getFilter });
        const wcsCall = global.fetch.mock.calls.find(c => c[0].includes('GetCoverage'));
        expect(wcsCall[0]).toContain('SUBSET');
        expect(wcsCall[0]).toContain('2024-03');
    });

    it('no incluye SUBSET si getFilter retorna undefined', async () => {
        const getFilter = vi.fn(() => undefined);
        await downloadLayerBundle('single-raster', { getFilter });
        const wcsCall = global.fetch.mock.calls.find(c => c[0].includes('GetCoverage'));
        expect(wcsCall[0]).not.toContain('SUBSET');
    });
});

describe('downloadLayerBundle — grupo vectorial', () => {
    it('retorna error si no hay subcapas activas', async () => {
        const result = await downloadLayerBundle('grupo-vec', { activeLayerIds: [] });
        expect(result.success).toBe(false);
        expect(result.error).toContain('subcapas activas');
    });

    it('descarga todas las subcapas activas', async () => {
        const result = await downloadLayerBundle('grupo-vec', { activeLayerIds: ['vec-1', 'vec-2'] });
        expect(result.success).toBe(true);
    });
});

describe('downloadLayerBundle — grupo raster', () => {
    it('descarga con subcapas activas', async () => {
        const result = await downloadLayerBundle('grupo-raster', { activeLayerIds: ['rast-1'] });
        expect(result.success).toBe(true);
    });
});

describe('downloadLayerBundle — wfsAvailable false', () => {
    it('no hace llamadas WFS y finaliza ok', async () => {
        const result = await downloadLayerBundle('wfs-disabled');
        const wfsCalls = global.fetch.mock.calls.filter(c => c[0].includes('WFS'));
        expect(wfsCalls).toHaveLength(0);
        expect(result.success).toBe(true);
    });
});

describe('downloadLayerBundle — error handling', () => {
    it('tolera fetch fallido gracias a Promise.allSettled', async () => {
        global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500, headers: { get: () => '' } }));
        const result = await downloadLayerBundle('single-vec');
        expect(result.success).toBe(true);
    });

    it('retorna success false cuando triggerDownload lanza excepción', async () => {
        global.URL.createObjectURL = vi.fn(() => { throw new Error('Blob error'); });
        const result = await downloadLayerBundle('single-vec');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Blob error');
    });
});

describe('downloadLayerBundle — metadata', () => {
    it('solicita metadata para la capa descargada', async () => {
        await downloadLayerBundle('single-vec');
        expect(mockGetLayerMetadata).toHaveBeenCalledWith('single-vec');
    });
});
