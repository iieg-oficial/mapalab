import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchWorkspaceCapabilities, getLayerExtent4326, clearCapabilitiesCache, sanitizeExtent4326 } from '@services/wmsCapabilitiesService';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';

const buildCapabilitiesXml = (layers) => {
    const layersXml = layers.map(l => `
        <Layer queryable="1">
            <Name>${l.name}</Name>
            <Title>${l.title || l.name}</Title>
            <CRS>EPSG:4326</CRS>
            <EX_GeographicBoundingBox>
                <westBoundLongitude>${l.minx}</westBoundLongitude>
                <eastBoundLongitude>${l.maxx}</eastBoundLongitude>
                <southBoundLatitude>${l.miny}</southBoundLatitude>
                <northBoundLatitude>${l.maxy}</northBoundLatitude>
            </EX_GeographicBoundingBox>
            <BoundingBox CRS="EPSG:4326" minx="${l.miny}" miny="${l.minx}" maxx="${l.maxy}" maxy="${l.maxx}"/>
        </Layer>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
        <WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
            <Capability>
                <Layer>
                    <Name>demografia</Name>
                    <Title>Workspace demografia</Title>
                    ${layersXml}
                </Layer>
            </Capability>
        </WMS_Capabilities>`;
};

describe('wmsCapabilitiesService', () => {
    beforeEach(() => {
        clearCapabilitiesCache();
        vi.restoreAllMocks();
    });

    it('parsea bbox de capas y retorna extent EPSG:4326', async () => {
        const xml = buildCapabilitiesXml([
            { name: 'demografia:poblacion', minx: -105, miny: 18, maxx: -101, maxy: 22 },
        ]);
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            text: async () => xml,
        });

        const index = await fetchWorkspaceCapabilities('http://gs/demografia/wms');
        expect(index.size).toBeGreaterThan(0);
        const entry = index.get('demografia:poblacion');
        expect(entry.extent).toEqual([-105, 18, -101, 22]);
    });

    it('cachea por baseUrl: una sola request para llamadas repetidas', async () => {
        const xml = buildCapabilitiesXml([
            { name: 'salud:hospitales', minx: -105, miny: 18, maxx: -101, maxy: 22 },
        ]);
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            text: async () => xml,
        });

        await fetchWorkspaceCapabilities('http://gs/salud/wms');
        await fetchWorkspaceCapabilities('http://gs/salud/wms');
        await fetchWorkspaceCapabilities('http://gs/salud/wms');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('deduplica requests in-flight concurrentes al mismo workspace', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(r => { resolveFetch = r; });
        const fetchSpy = vi.spyOn(global, 'fetch').mockReturnValue(fetchPromise);

        const a = fetchWorkspaceCapabilities('http://gs/raster/wms');
        const b = fetchWorkspaceCapabilities('http://gs/raster/wms');
        resolveFetch({ ok: true, text: async () => buildCapabilitiesXml([
            { name: 'raster:temp', minx: -105, miny: 18, maxx: -101, maxy: 22 },
        ]) });
        await Promise.all([a, b]);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('retorna null si fetch falla y cachea para evitar reintentos inmediatos', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 });
        const ext = await getLayerExtent4326({ baseUrl: 'http://gs/economia/wms', layerName: 'economia:gdp' });
        expect(ext).toBeNull();
    });

    it('encuentra extent por layerName y por nombre local (sin workspace prefix)', async () => {
        const xml = buildCapabilitiesXml([
            { name: 'general:limites', minx: -105, miny: 18, maxx: -101, maxy: 22 },
        ]);
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, text: async () => xml });

        const extFull = await getLayerExtent4326({
            baseUrl: 'http://gs/general/wms',
            layerName: 'general:limites',
        });
        expect(extFull).toEqual([-105, 18, -101, 22]);

        clearCapabilitiesCache();
        vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, text: async () => xml });
        const extLocal = await getLayerExtent4326({
            baseUrl: 'http://gs/general/wms',
            geoserverLayer: 'limites',
        });
        expect(extLocal).toEqual([-105, 18, -101, 22]);
    });

    it('retorna null si wmsConfig es falsy o no tiene baseUrl', async () => {
        expect(await getLayerExtent4326(null)).toBeNull();
        expect(await getLayerExtent4326({})).toBeNull();
    });
});

describe('sanitizeExtent4326', () => {
    it('deja intacto un extent plausible de Jalisco', () => {
        const ext = [-104, 19, -102, 21];
        expect(sanitizeExtent4326(ext)).toBe(ext);
    });

    it('recorta a Jalisco un bbox global corrupto (lat 90 -> sin Infinito al transformar)', () => {
        expect(sanitizeExtent4326([-180, 4.897, 180, 90])).toEqual(JALISCO_BOUNDS.coords);
    });

    it('recorta el error de signo en longitud este (+101.5 -> borde de Jalisco)', () => {
        const out = sanitizeExtent4326([-105.7, 18.94, 101.53, 22.56]);
        const [, , jmaxx] = JALISCO_BOUNDS.coords;
        expect(out[2]).toBeCloseTo(jmaxx, 5);
        expect(out[0]).toBeCloseTo(-105.7, 5);
    });

    it('rechaza extents no finitos o malformados', () => {
        expect(sanitizeExtent4326([0, 0, Infinity, 10])).toBeNull();
        expect(sanitizeExtent4326([1, 2, 3])).toBeNull();
        expect(sanitizeExtent4326(null)).toBeNull();
    });
});
