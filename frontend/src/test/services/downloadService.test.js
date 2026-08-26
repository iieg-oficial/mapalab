import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_BACKEND_API_HOST', 'http://api.test');

const testLayers = [
    {
        id: 'single-vec',
        label: 'Capa Sola',
        wmsConfig: { workspace: 'salud', baseUrl: 'http://geo.test/geoserver/salud/wms', layerName: 'salud:hospitales' }
    },
    {
        id: 'single-raster',
        label: 'Capa Raster',
        rasterPeriodicity: { 2024: { 3: '2024-03-01', 4: '2024-04-01' } },
        wmsConfig: { workspace: 'raster', baseUrl: 'http://geo.test/geoserver/raster/wms', layerName: 'raster:lluvia_2024', timeEnabled: true }
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

vi.mock('@pages/maps/helpers/layers/utils/layerHelpers', () => ({
    findLayerById: (id, arr) => findById(id, arr && arr.length ? arr : testLayers),
    collectLayersWithWMS: () => []
}));

vi.mock('@pages/maps/helpers/wmsConfig', () => ({
    findWMSConfig: (id, arr) => findWMS(id, arr && arr.length ? arr : testLayers)
}));

vi.mock('@services/layerMetadataService', () => ({
    getLayerMetadata: vi.fn().mockResolvedValue({})
}));

const mockBlob = new Blob(['data']);
let clickedLink = null;

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    clickedLink = null;

    global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            headers: { get: () => 'application/octet-stream' },
            blob: () => Promise.resolve(mockBlob),
            body: null,
        })
    );

    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();

    vi.spyOn(document.body, 'appendChild').mockImplementation((el) => { clickedLink = el; });
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

const { isRasterLayer, getLayerConfig, downloadSingleFormat, downloadWithMenu, getAvailableMetadata } = await import('@services/downloadService');

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

describe('getLayerConfig', () => {
    it('retorna config para capa vectorial', () => {
        const config = getLayerConfig('single-vec');
        expect(config.workspace).toBe('salud');
        expect(config.layerName).toBe('hospitales');
        expect(config.isRaster).toBe(false);
    });

    it('retorna config para capa raster', () => {
        const config = getLayerConfig('single-raster');
        expect(config.workspace).toBe('raster');
        expect(config.isRaster).toBe(true);
    });

    it('retorna null para ID inexistente', () => {
        expect(getLayerConfig('fantasma')).toBeNull();
    });
});

describe('downloadSingleFormat — CSV vectorial', () => {
    it('descarga CSV desde backend', async () => {
        const result = await downloadSingleFormat('single-vec', 'csv');
        expect(result.success).toBe(true);
        const call = global.fetch.mock.calls[0][0];
        expect(call).toContain('/download/salud/hospitales');
    });

    it('genera nombre con label y fecha', async () => {
        await downloadSingleFormat('single-vec', 'csv');
        expect(clickedLink).not.toBeNull();
        expect(clickedLink.download).toMatch(/Capa_Sola_\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('pasa date_from y date_to al backend', async () => {
        await downloadSingleFormat('single-vec', 'csv', { dateFrom: '2024-01-01', dateTo: '2024-12-31' });
        const call = global.fetch.mock.calls[0][0];
        expect(call).toContain('date_from=2024-01-01');
        expect(call).toContain('date_to=2024-12-31');
    });
});

describe('downloadSingleFormat — GeoServer WFS', () => {
    it('descarga GPKG via WFS', async () => {
        const result = await downloadSingleFormat('single-vec', 'geopackage');
        expect(result.success).toBe(true);
        const call = global.fetch.mock.calls[0][0];
        expect(call).toContain('WFS');
        expect(call).toContain('geopackage');
    });

    it('descarga SHP via WFS', async () => {
        const result = await downloadSingleFormat('single-vec', 'shape-zip');
        expect(result.success).toBe(true);
        const call = global.fetch.mock.calls[0][0];
        expect(call).toContain('shape-zip');
    });
});

describe('downloadSingleFormat — raster', () => {
    it('descarga GeoTIFF via WCS', async () => {
        const result = await downloadSingleFormat('single-raster', 'geotiff');
        expect(result.success).toBe(true);
        const call = global.fetch.mock.calls[0][0];
        expect(call).toContain('GetCoverage');
    });

    it('incluye SUBSET con timeValue si getFilter provee', async () => {
        const getFilter = vi.fn(() => '2024-03');
        await downloadSingleFormat('single-raster', 'geotiff', { getFilter });
        const call = global.fetch.mock.calls[0][0];
        expect(call).toContain('SUBSET');
        expect(call).toContain('2024-03');
    });

    it('no incluye SUBSET si getFilter retorna undefined', async () => {
        const getFilter = vi.fn(() => undefined);
        await downloadSingleFormat('single-raster', 'geotiff', { getFilter });
        const call = global.fetch.mock.calls[0][0];
        expect(call).not.toContain('SUBSET');
    });

    it('nombra el archivo con el mes descargado, no con el de hoy', async () => {
        const getFilter = vi.fn(() => '2024-03-01');
        await downloadSingleFormat('single-raster', 'geotiff', { getFilter });
        expect(clickedLink.download).toBe('Capa_Raster_2024-03.tiff');
    });

    it('da nombres distintos a meses distintos de la misma capa', async () => {
        await downloadSingleFormat('single-raster', 'geotiff', { getFilter: () => '2024-03-01' });
        const marzo = clickedLink.download;
        await downloadSingleFormat('single-raster', 'geotiff', { getFilter: () => '2024-04-01' });
        expect(clickedLink.download).not.toBe(marzo);
        expect(clickedLink.download).toBe('Capa_Raster_2024-04.tiff');
    });

    it('cae a la fecha de descarga cuando no hay filtro de tiempo', async () => {
        await downloadSingleFormat('single-raster', 'geotiff');
        expect(clickedLink.download).toMatch(/^Capa_Raster_\d{4}-\d{2}-\d{2}\.tiff$/);
    });
});

describe('downloadSingleFormat — cancelación', () => {
    it('retorna cancelled true al abortar', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        global.fetch = vi.fn().mockRejectedValue(abortError);
        const result = await downloadSingleFormat('single-vec', 'csv');
        expect(result.success).toBe(false);
        expect(result.cancelled).toBe(true);
    });

    it('pasa signal a fetch', async () => {
        const controller = new AbortController();
        await downloadSingleFormat('single-vec', 'geopackage', { signal: controller.signal });
        const fetchArgs = global.fetch.mock.calls[0][1];
        expect(fetchArgs).toMatchObject({ signal: controller.signal });
    });
});

describe('downloadSingleFormat — errores', () => {
    it('retorna error cuando capa no existe', async () => {
        const result = await downloadSingleFormat('fantasma', 'csv');
        expect(result.success).toBe(false);
        expect(result.error).toContain('no encontrada');
    });

    it('retorna error para formato no soportado', async () => {
        const result = await downloadSingleFormat('single-vec', 'xml-invalido');
        expect(result.success).toBe(false);
    });
});

describe('downloadWithMenu — fecha activa', () => {
    const yearFilter = "(fecha >= '2024-01-01' AND fecha < '2025-01-01')";

    it('traduce el CQL de fecha activa a date_from/date_to', async () => {
        const getSpecificFilter = vi.fn(() => yearFilter);
        await downloadWithMenu('single-vec', { formatId: 'csv', dateMode: 'active', getSpecificFilter });
        const call = global.fetch.mock.calls[0][0];
        expect(call).toContain('date_from=2024-01-01');
        expect(call).toContain('date_to=2024-12-31');
    });

    it('no manda fechas cuando el modo es todas las fechas', async () => {
        const getSpecificFilter = vi.fn(() => yearFilter);
        await downloadWithMenu('single-vec', { formatId: 'csv', dateMode: 'all', getSpecificFilter });
        const call = global.fetch.mock.calls[0][0];
        expect(call).not.toContain('date_from');
    });

    it('aplica el CQL de fecha activa en descargas WFS', async () => {
        const getSpecificFilter = vi.fn(() => yearFilter);
        await downloadWithMenu('single-vec', { formatId: 'geopackage', dateMode: 'active', getSpecificFilter });
        const call = decodeURIComponent(global.fetch.mock.calls[0][0].replace(/\+/g, ' '));
        expect(call).toContain('CQL_FILTER');
        expect(call).toContain("fecha >= '2024-01-01'");
    });

    it('nombra el archivo con el periodo del filtro activo', async () => {
        const getSpecificFilter = vi.fn(() => yearFilter);
        await downloadWithMenu('single-vec', { formatId: 'csv', dateMode: 'active', getSpecificFilter });
        expect(clickedLink.download).toBe('Capa_Sola_2024.csv');
    });

    it('conserva la fecha de descarga cuando el modo es todas las fechas', async () => {
        const getSpecificFilter = vi.fn(() => yearFilter);
        await downloadWithMenu('single-vec', { formatId: 'csv', dateMode: 'all', getSpecificFilter });
        expect(clickedLink.download).toMatch(/^Capa_Sola_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('cae a WFS con CQL cuando el filtro no es traducible a rango', async () => {
        const getSpecificFilter = vi.fn(() => 'anio = 2024');
        await downloadWithMenu('single-vec', { formatId: 'csv', dateMode: 'active', getSpecificFilter });
        const getFeatureUrl = global.fetch.mock.calls
            .map(c => c[0])
            .find(u => u.includes('GetFeature'));
        const call = decodeURIComponent(getFeatureUrl.replace(/\+/g, ' '));
        expect(call).toContain('WFS');
        expect(call).toContain('anio = 2024');
    });
});

describe('fetchLayerBlob — CSV sin geometría vía WFS', () => {
    it('pide propertyName sin columnas de geometría al descargar CSV por WFS', async () => {
        global.fetch = vi.fn((url) => {
            if (String(url).includes('DescribeFeatureType')) {
                return Promise.resolve({
                    ok: true,
                    headers: { get: () => 'application/json' },
                    json: () => Promise.resolve({
                        featureTypes: [{
                            properties: [
                                { name: 'geom_iieg', type: 'gml:MultiPolygon', localType: 'MultiPolygon' },
                                { name: 'geom_inegi', type: 'xsd:MultiPolygon', localType: 'MultiPolygon' },
                                { name: 'nombre', type: 'xsd:string', localType: 'string' },
                                { name: 'fecha', type: 'xsd:date', localType: 'date' },
                            ],
                        }],
                    }),
                });
            }
            return Promise.resolve({
                ok: true,
                headers: { get: () => 'text/csv' },
                blob: () => Promise.resolve(mockBlob),
                body: null,
            });
        });

        const getSpecificFilter = vi.fn(() => 'anio = 2024');
        await downloadWithMenu('single-vec', { formatId: 'csv', dateMode: 'active', getSpecificFilter });

        const getFeatureUrl = global.fetch.mock.calls
            .map(c => c[0])
            .find(u => u.includes('GetFeature'));
        const call = decodeURIComponent(getFeatureUrl.replace(/\+/g, ' '));
        expect(call).toContain('propertyName=nombre,fecha');
        expect(call).not.toContain('geom_iieg');
        expect(call).not.toContain('geom_inegi');
    });
});

describe('getAvailableMetadata', () => {
    it('detecta TXT y XLSX', () => {
        const meta = {
            metadato: [
                { nombre: 'TXT', enlace: 'http://test/doc.txt' },
                { nombre: 'XLSX', enlace: 'http://test/doc.xlsx' }
            ]
        };
        const result = getAvailableMetadata(meta);
        expect(result.hasTxt).toBe(true);
        expect(result.hasXlsx).toBe(true);
    });

    it('retorna false cuando no hay metadata', () => {
        const result = getAvailableMetadata({});
        expect(result.hasTxt).toBe(false);
        expect(result.hasXlsx).toBe(false);
    });

    it('maneja metadato como objeto singular', () => {
        const meta = { metadato: { nombre: 'TXT', enlace: 'http://test/doc.txt' } };
        const result = getAvailableMetadata(meta);
        expect(result.hasTxt).toBe(true);
        expect(result.hasXlsx).toBe(false);
    });
});
