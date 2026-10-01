import { describe, it, expect } from 'vitest';
import { opcionesFormato, opcionesVista, textoBotonDescarga } from '@pages/maps/components/MapExport/utils/opcionesDescarga';

const seleccionados = (opciones) => opciones.find(o => o.value === 'seleccion');

describe('opcionesVista', () => {
    it('sin polígono la opción Selección no aparece', () => {
        expect(seleccionados(opcionesVista({ haySeleccion: false, isSwipe: false }))).toBeUndefined();
    });

    it('con polígono aparece como Selección y explica qué descarga', () => {
        const opcion = seleccionados(opcionesVista({ haySeleccion: true, isSwipe: false }));
        expect(opcion.label).toBe('Selección');
        expect(opcion.tooltip).toMatch(/Medir área y seleccionar/);
    });

    it('en el comparador no aparece aunque haya polígono', () => {
        expect(seleccionados(opcionesVista({ haySeleccion: true, isSwipe: true }))).toBeUndefined();
    });

    it('todas las vistas llevan tooltip', () => {
        opcionesVista({ haySeleccion: true, isSwipe: false }).forEach((o) => expect(o.tooltip).toBeTruthy());
    });
});

describe('opcionesFormato', () => {
    it('en el comparador solo deja PNG', () => {
        const opciones = opcionesFormato(true);
        expect(opciones.filter(o => !o.disabled).map(o => o.value)).toEqual(['png']);
        expect(opciones.map(o => o.value)).toEqual(['png', 'jpeg', 'pdf']);
    });
});

describe('textoBotonDescarga', () => {
    it('Área manda a ajustar el recuadro y las demás descargan', () => {
        expect(textoBotonDescarga('viewport', 'png')).toBe('Ir a seleccionar área');
        expect(textoBotonDescarga('seleccion', 'pdf')).toBe('Descargar PDF');
    });
});
