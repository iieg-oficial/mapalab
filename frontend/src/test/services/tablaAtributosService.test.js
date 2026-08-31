import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { construirOrden, fetchPagina, ordenarColumnas } from '@services/tablaAtributosService';

const wmsConfig = {
    baseUrl: 'https://geo.example.mx/educacion/wms',
    layerName: 'educacion:escuelas',
};

describe('construirOrden', () => {
    it('traduce la direccion al sufijo que espera el WFS', () => {
        expect(construirOrden({ columna: 'alumnos', descendente: false })).toBe('alumnos A');
        expect(construirOrden({ columna: 'alumnos', descendente: true })).toBe('alumnos D');
        expect(construirOrden(null)).toBeNull();
    });
});

describe('ordenarColumnas', () => {
    it('aplica alias, orden y visibilidad de la configuracion', () => {
        const columnas = ordenarColumnas(['cve_mun', 'p_total'], [
            { columna: 'p_total', alias: 'Población', orden: 0, visible: true, formato: 'entero' },
            { columna: 'cve_mun', alias: 'Municipio', orden: 1, visible: false, formato: null },
        ]);
        expect(columnas.map(c => c.nombre)).toEqual(['p_total', 'cve_mun']);
        expect(columnas[0].etiqueta).toBe('Población');
        expect(columnas[1].visible).toBe(false);
    });

    it('deja las columnas sin configurar con su nombre crudo y el orden del WFS', () => {
        const columnas = ordenarColumnas(['a', 'b'], []);
        expect(columnas.map(c => c.etiqueta)).toEqual(['a', 'b']);
        expect(columnas.every(c => c.visible)).toBe(true);
    });
});

describe('fetchPagina', () => {
    beforeEach(() => { global.fetch = vi.fn(); });
    afterEach(() => { vi.restoreAllMocks(); });

    const responder = (cuerpo) => Promise.resolve({
        ok: true,
        text: () => Promise.resolve(cuerpo),
    });

    it('pide la pagina con count y startIndex', async () => {
        global.fetch.mockReturnValue(responder(JSON.stringify({ features: [{ id: 'a' }] })));
        const resultado = await fetchPagina(wmsConfig, { cql: 'a = 1', pagina: 2, tamano: 50 });

        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('count=50');
        expect(url).toContain('startIndex=100');
        expect(resultado.features).toHaveLength(1);
    });

    it('convierte en error la excepcion que GeoServer manda con HTTP 200', async () => {
        global.fetch.mockReturnValue(responder(
            '<ows:ExceptionReport><ows:ExceptionText>Could not parse CQL filter list</ows:ExceptionText></ows:ExceptionReport>',
        ));
        await expect(fetchPagina(wmsConfig, {})).rejects.toThrow('Could not parse CQL filter list');
    });
});
