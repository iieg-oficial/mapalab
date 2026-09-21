import { describe, it, expect } from 'vitest';
import { notaVista, opcionesFormato, opcionesVista, textoBotonDescarga } from '@pages/maps/components/MapExport/utils/opcionesDescarga';

const seleccionados = (opciones) => opciones.find(o => o.value === 'seleccion');

describe('opcionesVista', () => {
    it('Seleccionados se deshabilita sin polígono y explica cómo usarla', () => {
        const opcion = seleccionados(opcionesVista({ haySeleccion: false, isSwipe: false }));
        expect(opcion.disabled).toBe(true);
        expect(opcion.tooltip).toMatch(/Medir área y seleccionar/);
    });

    it('con polígono se puede elegir', () => {
        expect(seleccionados(opcionesVista({ haySeleccion: true, isSwipe: false })).disabled).toBeUndefined();
    });

    it('en el comparador no está disponible aunque haya polígono', () => {
        expect(seleccionados(opcionesVista({ haySeleccion: true, isSwipe: true })).disabled).toBe(true);
    });

    it('todas las vistas llevan tooltip y nota', () => {
        opcionesVista({ haySeleccion: true, isSwipe: false }).forEach((o) => {
            expect(o.tooltip).toBeTruthy();
            expect(notaVista(o.value)).toBeTruthy();
        });
    });
});

describe('opcionesFormato', () => {
    it('en el comparador solo deja PNG y anuncia GIF', () => {
        const opciones = opcionesFormato(true);
        expect(opciones.filter(o => !o.disabled).map(o => o.value)).toEqual(['png']);
        expect(opciones.at(-1)).toMatchObject({ value: 'gif', disabled: true });
    });
});

describe('textoBotonDescarga', () => {
    it('Área manda a ajustar el recuadro y las demás descargan', () => {
        expect(textoBotonDescarga('viewport', 'png')).toBe('Ir a seleccionar área');
        expect(textoBotonDescarga('seleccion', 'pdf')).toBe('Descargar PDF');
    });
});
