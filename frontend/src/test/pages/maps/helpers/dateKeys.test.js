import { describe, it, expect } from 'vitest';
import { dateKeysFromFilter, dateRangeOfKeys, keyToSelection, selectionToKey } from '@pages/maps/helpers/dateKeys';

const RASTER = { 2023: '2023-01-01', 2024: { 1: '2024-01-01', 2: '2024-02-01' } };

describe('dateKeysFromFilter', () => {
    it('lee el formato viejo de mapalab y el de zootropo', () => {
        expect(dateKeysFromFilter("((fecha >= '2024-01-01' AND fecha < '2024-02-01') OR (fecha >= '2024-02-01' AND fecha < '2024-03-01'))"))
            .toEqual(['2024-01', '2024-02']);
        expect(dateKeysFromFilter("fecha >= '2024-01-01' AND fecha < '2024-03-01'")).toEqual(['2024-01', '2024-02']);
        expect(dateKeysFromFilter("fecha = '2024-03-05'")).toEqual(['2024-03-05']);
    });

    it('acepta columnas entre comillas y rangos por hora', () => {
        expect(dateKeysFromFilter("\"obs fecha\" >= '2024-03-05T06:00:00Z' AND \"obs fecha\" < '2024-03-05T08:00:00Z'"))
            .toEqual(['2024-03-05T06', '2024-03-05T07']);
    });

    it('resuelve el instante TIME con la periodicidad raster', () => {
        expect(dateKeysFromFilter('2023-01-01', { rasterPeriodicity: RASTER })).toEqual(['2023']);
        expect(dateKeysFromFilter('2024-02-01', { rasterPeriodicity: RASTER })).toEqual(['2024-02']);
        expect(dateKeysFromFilter('2030-01-01', { rasterPeriodicity: RASTER })).toEqual([]);
    });

    it('ignora lo que no es un filtro de fecha', () => {
        expect(dateKeysFromFilter('anio = 2024')).toEqual([]);
        expect(dateKeysFromFilter(null)).toEqual([]);
    });
});

describe('conversiones', () => {
    it('pasa entre selecciones de mapalab y llaves de zootropo', () => {
        expect(selectionToKey('2024-3-5')).toBe('2024-03-05');
        expect(selectionToKey('2024')).toBe('2024');
        expect(keyToSelection('2024-03')).toBe('2024-3');
    });

    it('da el rango de fechas de unas llaves', () => {
        expect(dateRangeOfKeys(['2024-03', '2024-01'])).toEqual({ dateFrom: '2024-01-01', dateTo: '2024-03-31' });
        expect(dateRangeOfKeys([])).toBeNull();
    });
});
