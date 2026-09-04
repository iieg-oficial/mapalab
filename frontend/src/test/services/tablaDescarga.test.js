import { describe, it, expect } from 'vitest';
import { columnasParaDescarga, construirDescarga, nombreDeArchivo } from '@services/tablaDescarga';
import { findVectorFormat } from '@services/downloadUrls';

const wmsConfig = {
    baseUrl: 'https://geo.example.mx/educacion/wms',
    layerName: 'educacion:escuelas',
};

const columnas = [
    { nombre: 'clave', visible: true },
    { nombre: 'municipio', visible: true },
    { nombre: 'interna', visible: false },
];

describe('nombreDeArchivo', () => {
    it('limpia acentos y espacios', () => {
        expect(nombreDeArchivo('Centros educativos', findVectorFormat('csv'))).toBe('centros_educativos.csv');
        expect(nombreDeArchivo('Educación básica', findVectorFormat('geopackage'))).toBe('educacion_basica.gpkg');
    });

    it('cae en un nombre util si la capa no lo tiene', () => {
        expect(nombreDeArchivo('', findVectorFormat('csv'))).toBe('tabla.csv');
    });
});

describe('columnasParaDescarga', () => {
    it('en CSV baja solo las visibles', () => {
        expect(columnasParaDescarga({ formatoId: 'csv', columnas, soloVisibles: true }))
            .toEqual(['clave', 'municipio']);
    });

    it('en GPKG suma la geometria, porque sin ella el archivo no sirve', () => {
        expect(columnasParaDescarga({ formatoId: 'geopackage', columnas, soloVisibles: true, campoGeometria: 'geom' }))
            .toEqual(['clave', 'municipio', 'geom']);
    });

    it('en GPKG sin saber la geometria pide todo, para no romper el archivo', () => {
        expect(columnasParaDescarga({ formatoId: 'geopackage', columnas, soloVisibles: true })).toBeNull();
    });

    it('sin recorte pide todas', () => {
        expect(columnasParaDescarga({ formatoId: 'csv', columnas, soloVisibles: false })).toBeNull();
    });
});

describe('construirDescarga', () => {
    it('lleva el filtro de la tabla y las columnas visibles', () => {
        const { url, archivo } = construirDescarga({
            wmsConfig,
            formatoId: 'csv',
            cql: "municipio = 'Zapopan'",
            columnas,
            soloVisibles: true,
            nombreCapa: 'Escuelas',
        });

        expect(url).toContain('outputFormat=csv');
        expect(url).toContain('propertyName=clave%2Cmunicipio');
        expect(decodeURIComponent(url.replace(/\+/g, ' '))).toContain("CQL_FILTER=municipio = 'Zapopan'");
        expect(archivo).toBe('escuelas.csv');
    });

    it('sin capa o formato no arma nada', () => {
        expect(construirDescarga({ wmsConfig: null, formatoId: 'csv' })).toBeNull();
        expect(construirDescarga({ wmsConfig, formatoId: 'inventado' })).toBeNull();
    });
});
