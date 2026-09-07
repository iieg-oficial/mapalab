import { describe, it, expect } from 'vitest';
import { gruposDe, seriePorMunicipio, seriePorIndicador, seriesDe } from '@pages/maps/helpers/comparadorSeries';

const fila = (nombre, celdas, { esBase = false, enPuntos = true } = {}) => ({
    nombre, esBase, enPuntos, celdas,
});

const celda = (bruto, porcentaje) => ({ bruto, porcentaje });

const columnas = [
    { clave: '039', nombre: 'Guadalajara' },
    { clave: '120', nombre: 'Zapopan' },
];

const filas = [
    fila('Total', [celda(1000, null), celda(500, null)], { esBase: true, enPuntos: false }),
    fila('Público', [celda(700, 70), celda(250, 50)]),
    fila('Privado', [celda(300, 30), celda(250, 50)]),
    fila('Promedio', [celda(4.5, null), celda(6.2, null)], { enPuntos: false }),
];

describe('gruposDe', () => {
    it('deja fuera la fila base y las no proporcionales', () => {
        expect(gruposDe(filas).map(f => f.nombre)).toEqual(['Público', 'Privado']);
    });

    it('devuelve vacío sin filas', () => {
        expect(gruposDe([])).toEqual([]);
    });
});

describe('seriePorMunicipio', () => {
    const grupos = gruposDe(filas);

    it('traza el perfil del municipio pedido a lo largo de los indicadores', () => {
        const serie = seriePorMunicipio(columnas, grupos, '120');
        expect(serie.ejes).toEqual(['Público', 'Privado']);
        expect(serie.puntos.map(p => p.pct)).toEqual([50, 50]);
        expect(serie.titulo).toBe('Zapopan');
    });

    it('cae en el primer municipio si la clave ya no existe', () => {
        const serie = seriePorMunicipio(columnas, grupos, '999');
        expect(serie.titulo).toBe('Guadalajara');
        expect(serie.puntos.map(p => p.pct)).toEqual([70, 30]);
    });

    it('deja un hueco donde no hay porcentaje, en vez de inventarlo', () => {
        const conHueco = [
            fila('Público', [celda(700, 70), celda(null, null)]),
            fila('Privado', [celda(300, 30), celda(250, 50)]),
        ];
        const serie = seriePorMunicipio(columnas, conHueco, '120');
        expect(serie.puntos[0]).toBeNull();
        expect(serie.puntos[1].pct).toBe(50);
    });
});

describe('seriePorIndicador', () => {
    const grupos = gruposDe(filas);

    it('traza un indicador a lo largo de los municipios', () => {
        const serie = seriePorIndicador(columnas, grupos, 'Privado');
        expect(serie.ejes).toEqual(['Guadalajara', 'Zapopan']);
        expect(serie.puntos.map(p => p.pct)).toEqual([30, 50]);
        expect(serie.titulo).toBe('Privado');
    });

    it('cae en el primer indicador si el nombre ya no existe', () => {
        const serie = seriePorIndicador(columnas, grupos, 'No existe');
        expect(serie.titulo).toBe('Público');
    });

    it('conserva el bruto junto al porcentaje', () => {
        const serie = seriePorIndicador(columnas, grupos, 'Público');
        expect(serie.puntos.map(p => p.bruto)).toEqual([700, 250]);
    });

    it('etiqueta cada punto con el municipio', () => {
        const serie = seriePorIndicador(columnas, grupos, 'Público');
        expect(serie.puntos.map(p => p.etiqueta)).toEqual(['Guadalajara', 'Zapopan']);
    });
});

describe('seriesDe', () => {
    const grupos = gruposDe(filas);

    it('traza una linea por municipio elegido', () => {
        const series = seriesDe(columnas, grupos, 'municipio', ['039', '120']);
        expect(series.map(s => s.titulo)).toEqual(['Guadalajara', 'Zapopan']);
    });

    it('da un color distinto a cada propiedad elegida', () => {
        const series = seriesDe(columnas, grupos, 'propiedad', ['Público', 'Privado']);
        expect(series.map(s => s.titulo)).toEqual(['Público', 'Privado']);
        expect(series[0].tono).not.toBe(series[1].tono);
    });

    it('acepta un valor suelto ademas de una lista', () => {
        expect(seriesDe(columnas, grupos, 'municipio', '120')).toHaveLength(1);
    });

    it('devuelve vacio sin seleccion', () => {
        expect(seriesDe(columnas, grupos, 'municipio', [])).toEqual([]);
        expect(seriesDe(columnas, grupos, 'municipio', null)).toEqual([]);
    });
});
