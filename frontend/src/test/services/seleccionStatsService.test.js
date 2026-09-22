import { describe, it, expect, vi, beforeEach } from 'vitest';
import Polygon from 'ol/geom/Polygon';

vi.mock('@pages/maps/helpers/wmsConfig', () => ({
    findWMSConfig: (id) => (id === 'sin-wfs'
        ? { baseUrl: 'https://mapas.test/sextante/wms', layerName: 'raster:nddi', wfsAvailable: false }
        : { baseUrl: 'https://mapas.test/sextante/wms', layerName: 'educacion:escuelas' }),
}));
vi.mock('@utils/featureInfoUtils', () => ({
    fetchGeometryColumns: async () => ({ 'educacion:escuelas': 'geom' }),
    getWfsUrl: (url) => url.replace('/wms', '/wfs'),
}));

import { agregarEnPoligono, camposNumericos, construirAgregado, contarEnPoligono, esCampoNumerico, filtroDePoligono, leerAgregado, leerNumberMatched, wktDelPoligono, MAX_VERTICES } from '@services/seleccionStatsService';

const cuadro = new Polygon([[[0, 0], [1000, 0], [1000, 1000], [0, 1000], [0, 0]]]);

const dentado = () => {
    const anillo = [];
    for (let i = 0; i < 400; i += 1) {
        anillo.push([Math.cos(i) * 5000 + (i % 2) * 3, Math.sin(i) * 5000]);
    }
    anillo.push(anillo[0]);
    return new Polygon([anillo]);
};

describe('wktDelPoligono', () => {
    it('escribe el anillo con coordenadas enteras', () => {
        expect(wktDelPoligono(cuadro)).toBe('POLYGON((0 0,1000 0,1000 1000,0 1000,0 0))');
    });

    it('simplifica los polígonos con demasiados vértices', () => {
        const wkt = wktDelPoligono(dentado());
        expect(wkt.split(',').length).toBeLessThanOrEqual(MAX_VERTICES);
    });
});

describe('filtroDePoligono', () => {
    it('manda el sistema de coordenadas del visor, que no es el de los datos', () => {
        expect(filtroDePoligono('geom', 'POLYGON((0 0,1 0,1 1,0 0))'))
            .toBe('INTERSECTS(geom, SRID=3857;POLYGON((0 0,1 0,1 1,0 0)))');
    });
});

describe('leerNumberMatched', () => {
    it('lee el total de la respuesta y tolera basura', () => {
        expect(leerNumberMatched('<wfs:FeatureCollection numberMatched="1284" numberReturned="0"/>')).toBe(1284);
        expect(leerNumberMatched('<ows:ExceptionReport/>')).toBeNull();
        expect(leerNumberMatched(null)).toBeNull();
    });
});

describe('contarEnPoligono', () => {
    beforeEach(() => { global.fetch = vi.fn(); });

    it('cuenta sin descargar elementos y respeta el filtro de la capa', async () => {
        global.fetch.mockResolvedValue({ ok: true, text: async () => '<wfs:FeatureCollection numberMatched="97"/>' });
        const filas = await contarEnPoligono(
            [{ id: 'escuelas', label: 'Escuelas' }],
            cuadro,
            { getFilter: () => 'nivel=\'primaria\'', allLayers: [] },
        );
        expect(filas).toEqual([{ id: 'escuelas', etiqueta: 'Escuelas', conteo: 97 }]);
        const [url, opciones] = global.fetch.mock.calls[0];
        expect(url).toBe('https://mapas.test/sextante/wfs');
        expect(opciones.body).toContain('RESULTTYPE=hits');
        const cql = decodeURIComponent(opciones.body.replace(/\+/g, ' '));
        expect(cql).toContain("(nivel='primaria') AND INTERSECTS(geom, SRID=3857;POLYGON");
    });

    it('una capa sin WFS, como un ráster, queda sin conteo', async () => {
        const filas = await contarEnPoligono([{ id: 'sin-wfs', label: 'NDDI' }], cuadro, {});
        expect(filas[0].conteo).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('si el servidor falla, la fila queda sin conteo y no truena', async () => {
        global.fetch.mockRejectedValue(new Error('timeout'));
        const filas = await contarEnPoligono([{ id: 'escuelas', label: 'Escuelas' }], cuadro, {});
        expect(filas[0].conteo).toBeNull();
    });

    it('sin polígono o sin capas no consulta nada', async () => {
        expect(await contarEnPoligono([], cuadro, {})).toEqual([]);
        expect(await contarEnPoligono([{ id: 'escuelas' }], null, {})).toEqual([]);
    });
});

describe('campos numéricos', () => {
    beforeEach(() => { global.fetch = vi.fn(); });

    it('deja solo los campos que se pueden sumar', () => {
        expect(esCampoNumerico({ name: 'poblacion', type: 'xsd:number' })).toBe(true);
        expect(esCampoNumerico({ name: 'nombre', type: 'xsd:string' })).toBe(false);
        expect(esCampoNumerico({ name: 'geom', type: 'gml:MultiPolygon' })).toBe(false);
    });

    it('los lee de la descripción de la capa', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ featureTypes: [{ properties: [
                { name: 'geom', type: 'gml:Point' },
                { name: 'nombre', type: 'xsd:string' },
                { name: 'alumnos', type: 'xsd:number' },
            ] }] }),
        });
        expect(await camposNumericos({ id: 'escuelas' }, [])).toEqual(['alumnos']);
    });

    it('una capa sin WFS no ofrece campos', async () => {
        expect(await camposNumericos({ id: 'sin-wfs' }, [])).toEqual([]);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});

describe('agregado con WPS', () => {
    beforeEach(() => { global.fetch = vi.fn(); });

    it('arma la petición con el campo y el filtro del polígono', () => {
        const xml = construirAgregado({ typeName: 'educacion:escuelas', campo: 'alumnos', cql: 'INTERSECTS(geom, SRID=3857;POLYGON((0 0,1 0,1 1,0 0)))' });
        expect(xml).toContain('<ows:Identifier>gs:Aggregate</ows:Identifier>');
        expect(xml).toContain('<wps:LiteralData>alumnos</wps:LiteralData>');
        expect(xml).toContain('typeName=educacion:escuelas');
        expect(xml).toContain(encodeURIComponent('SRID=3857'));
        ['Count', 'Sum', 'Average'].forEach(f => expect(xml).toContain(`<wps:LiteralData>${f}</wps:LiteralData>`));
    });

    it('lee el resultado sin depender del orden de las funciones', () => {
        expect(leerAgregado({
            AggregationFunctions: ['Average', 'Count', 'Sum'],
            AggregationResults: [[301.82, 4200, 1267644.97]],
        })).toEqual({ conteo: 4200, suma: 1267644.97, promedio: 301.82 });
    });

    it('un resultado vacío no inventa números', () => {
        expect(leerAgregado({ AggregationFunctions: ['Sum'], AggregationResults: [[null]] })).toEqual({ conteo: null, suma: null, promedio: null });
        expect(leerAgregado({})).toBeNull();
    });

    it('sin campo elegido no consulta', async () => {
        expect(await agregarEnPoligono({ capa: { id: 'escuelas' }, campo: null, poligono: cuadro })).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('si GeoServer falla, la capa se queda sin suma', async () => {
        global.fetch.mockResolvedValue({ ok: false });
        expect(await agregarEnPoligono({ capa: { id: 'escuelas' }, campo: 'alumnos', poligono: cuadro })).toBeNull();
    });
});
