import { describe, it, expect } from 'vitest';
import { ordenarColumnas } from '@services/tablaAtributosService';

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
