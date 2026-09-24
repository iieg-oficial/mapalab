import { describe, it, expect } from 'vitest';
import { filasSeleccion, MAX_CAPAS_SELECCION } from '@pages/maps/components/MapExport/utils/estadisticasSeleccion';

describe('filasSeleccion', () => {
    it('abre con área y perímetro y agrega la densidad de cada capa', () => {
        const filas = filasSeleccion({
            areaKm2: 5829.45,
            perimetroKm: 366.99,
            capas: [{ etiqueta: 'Escuelas', conteo: 1284 }],
        });
        expect(filas[0]).toEqual({ etiqueta: 'Área', valor: '5,829.45 km²' });
        expect(filas[1]).toEqual({ etiqueta: 'Perímetro', valor: '366.99 km' });
        expect(filas[2]).toEqual({ etiqueta: 'Escuelas', valor: '1,284', detalle: '0.22 / km²' });
    });

    it('una capa sin WFS dice que no aplica y una consulta fallida dice que no hubo dato', () => {
        const [, , raster, fallida] = filasSeleccion({
            areaKm2: 100,
            capas: [
                { id: 'nddi', etiqueta: 'NDDI', conteo: null, sinWfs: true },
                { id: 'escuelas', etiqueta: 'Escuelas', conteo: null },
            ],
        });
        expect(raster).toEqual({ etiqueta: 'NDDI', valor: 'No aplica', detalle: null });
        expect(fallida).toEqual({ etiqueta: 'Escuelas', valor: 'Sin dato', detalle: null });
    });

    it('debajo de la capa dice cuántos elementos cruzan el borde y no se contaron', () => {
        const filas = filasSeleccion({ areaKm2: 100, capas: [{ id: 'mun', etiqueta: 'Municipios', conteo: 2, enBorde: 3 }] });
        expect(filas[2]).toEqual({ etiqueta: 'Municipios', valor: '2', detalle: '0.02 / km²' });
        expect(filas[3]).toEqual({ etiqueta: 'Cruzan el borde, sin contar', valor: '3', sangria: true });
    });

    it('no pinta más capas de las que caben', () => {
        const capas = Array.from({ length: 10 }, (_, i) => ({ etiqueta: `Capa ${i}`, conteo: i }));
        expect(filasSeleccion({ areaKm2: 10, capas })).toHaveLength(MAX_CAPAS_SELECCION + 2);
    });
});

describe('filasSeleccion con agregados', () => {
    it('cuelga la suma y el promedio debajo de su capa', () => {
        const filas = filasSeleccion({
            areaKm2: 5829.45,
            capas: [{ id: 'brecha', etiqueta: 'Brecha salarial', conteo: 4200 }],
            agregados: [{ id: 'brecha', etiqueta: 'Salario diario, mujeres', datos: { suma: 1267644.97, promedio: 301.82 } }],
        });
        expect(filas.slice(2)).toEqual([
            { etiqueta: 'Brecha salarial', valor: '4,200', detalle: '0.72 / km²' },
            { etiqueta: 'Salario diario, mujeres, suma', valor: '1,267,644.97', sangria: true },
            { etiqueta: 'Salario diario, mujeres, promedio', valor: '301.82', sangria: true },
        ]);
    });

    it('si el agregado no llegó, la capa queda con su conteo', () => {
        const filas = filasSeleccion({
            areaKm2: 100,
            capas: [{ id: 'escuelas', etiqueta: 'Escuelas', conteo: 10 }],
            agregados: [{ id: 'escuelas', etiqueta: 'Alumnos', datos: null }],
        });
        expect(filas).toHaveLength(3);
    });
});

describe('filasSeleccion por clase', () => {
    it('cuelga las clases bajo su capa y agrega Otras', () => {
        const filas = filasSeleccion({
            areaKm2: 12.76,
            capas: [{ id: 'cultivos', etiqueta: 'Clasificador de cultivos', conteo: 208 }],
            agregados: [{ id: 'cultivos', etiqueta: 'Cultivo', datos: { clases: [{ clase: 'Maíz grano', conteo: 142 }, { clase: 'Agave', conteo: 40 }], otras: 26 } }],
        });
        expect(filas.slice(3)).toEqual([
            { etiqueta: 'Maíz grano', valor: '142', sangria: true },
            { etiqueta: 'Agave', valor: '40', sangria: true },
            { etiqueta: 'Otras', valor: '26', sangria: true },
        ]);
    });
});
