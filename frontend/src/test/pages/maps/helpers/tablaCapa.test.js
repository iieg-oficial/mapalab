import { describe, it, expect } from 'vitest';
import { hojasConTabla, resolverObjetivo } from '@pages/maps/helpers/tablaCapa';

const hoja = (id, extra = {}) => ({
    id,
    geometryType: 'point',
    wmsConfig: { baseUrl: 'https://geo.mx/general/wms', layerName: `general:${id}`, workspace: 'general' },
    ...extra,
});

describe('resolverObjetivo', () => {
    it('usa la capa tal cual cuando es una hoja con WFS', () => {
        const objetivo = resolverObjetivo(hoja('aeropuertos'));
        expect(objetivo.wmsConfig.layerName).toBe('general:aeropuertos');
        expect(objetivo.esGrupo).toBe(false);
        expect(objetivo.motivo).toBeNull();
    });

    it('resuelve un grupo a la tabla que comparten sus capas', () => {
        const grupo = {
            id: 'delitos',
            children: [
                hoja('robo', { wmsConfig: { baseUrl: 'https://geo.mx/seguridad/wms', layerName: 'seguridad:delitos', cqlFilter: "tipo = 'robo'" } }),
                hoja('homicidio', { wmsConfig: { baseUrl: 'https://geo.mx/seguridad/wms', layerName: 'seguridad:delitos', cqlFilter: "tipo = 'homicidio'" } }),
            ],
        };
        const objetivo = resolverObjetivo(grupo);

        expect(objetivo.esGrupo).toBe(true);
        expect(objetivo.hojas).toBe(2);
        expect(objetivo.wmsConfig.layerName).toBe('seguridad:delitos');
        expect(objetivo.wmsConfig.cqlFilter).toBeUndefined();
    });

    it('conserva el filtro cuando el grupo tiene una sola capa con datos', () => {
        const grupo = {
            id: 'uno',
            children: [
                hoja('unico', { wmsConfig: { baseUrl: 'https://geo.mx/a/wms', layerName: 'a:tabla', cqlFilter: 'anio = 2026' } }),
                { id: 'etiqueta', isLabel: true },
            ],
        };
        expect(resolverObjetivo(grupo).wmsConfig.cqlFilter).toBe('anio = 2026');
    });

    it('cae en la primera capa cuando el grupo mezcla tablas distintas', () => {
        const grupo = {
            id: 'mezcla',
            children: [hoja('escuelas'), hoja('hospitales')],
        };
        expect(resolverObjetivo(grupo).wmsConfig.layerName).toBe('general:escuelas');
    });

    it('explica por que un grupo sin datos no abre tabla', () => {
        const grupo = { id: 'raster', children: [hoja('lluvia', { wmsConfig: { baseUrl: 'x', workspace: 'lluvia' } })] };
        expect(resolverObjetivo(grupo).motivo).toBe('Ninguna capa de este grupo publica sus datos.');
    });

    it('distingue el raster de la capa que no publica WFS', () => {
        const raster = { id: 'temp', geometryType: 'raster', wmsConfig: { baseUrl: 'x', workspace: 'temperatura' } };
        expect(resolverObjetivo(raster).motivo).toBe('Esta capa es una imagen: no tiene tabla de datos.');

        const sinWfs = hoja('privada', { wmsConfig: { baseUrl: 'x', layerName: 'a:b', wfsAvailable: false } });
        expect(resolverObjetivo(sinWfs).motivo).toBe('Esta capa no publica sus datos.');
    });
});

describe('hojasConTabla', () => {
    it('recorre el arbol completo y descarta etiquetas', () => {
        const arbol = {
            id: 'raiz',
            children: [
                { id: 'rama', children: [hoja('a'), { id: 'etiqueta', isLabel: true }] },
                hoja('b'),
            ],
        };
        expect(hojasConTabla(arbol).map(item => item.id)).toEqual(['a', 'b']);
    });
});
