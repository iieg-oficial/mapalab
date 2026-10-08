import { describe, it, expect } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { cerrarPin, coordenadasDePin, etiquetaDePin, textoVisibleDePin } from '@pages/maps/helpers/pin';
import { serializeAnnotations } from '@pages/maps/helpers/annotationsSerialization';
import { buildRestoredItems } from '@pages/maps/helpers/restoreAnnotations';
import { anotacionDeMedicion } from '@pages/maps/helpers/medicion3dCapas';
import { anotacionesPuntuales } from '@pages/maps/hooks/useAnotacionesPuntuales3d';

const GUADALAJARA = [-103.34437, 20.67361];

const pin = (props = {}) => new Feature({
    geometry: new Point(fromLonLat(GUADALAJARA)),
    annotationType: 'Pin',
    ...props,
});

describe('pin', () => {
    it('escribe las coordenadas como latitud, longitud con cinco decimales', () => {
        expect(coordenadasDePin(pin().getGeometry())).toBe('20.67361, -103.34437');
    });

    it('en el mapa muestra nada, las coordenadas o el texto segun la etiqueta elegida', () => {
        expect(textoVisibleDePin(pin())).toBe('');
        expect(textoVisibleDePin(pin({ pinEtiqueta: 'coordenadas' }))).toBe('20.67361, -103.34437');
        expect(textoVisibleDePin(pin({ pinEtiqueta: 'texto', textLabel: 'Oficina' }))).toBe('Oficina');
    });

    it('en la lista siempre lleva las coordenadas y el texto cuando lo hay', () => {
        expect(etiquetaDePin(pin())).toBe('Pin: 20.67361, -103.34437');
        expect(etiquetaDePin(pin({ pinEtiqueta: 'texto', textLabel: 'Oficina' }))).toBe('Pin: Oficina\n20.67361, -103.34437');
    });

    it('al cerrarlo deja valor, etiqueta y estilo en la feature', () => {
        const feature = pin();
        const cierre = cerrarPin(feature);
        expect(cierre).toEqual({ value: '20.67361, -103.34437', label: 'Pin: 20.67361, -103.34437' });
        expect(feature.get('measurementValue')).toBe('20.67361, -103.34437');
        expect(feature.get('cachedStyle')).toBeTruthy();
    });

    it('se guarda y vuelve con su etiqueta y su texto', () => {
        const guardado = serializeAnnotations([{
            id: 'p1',
            type: 'Pin',
            label: 'Pin: Oficina',
            feature: pin({ pinEtiqueta: 'texto', textLabel: 'Oficina' }),
        }]);
        expect(guardado[0].pinEtiqueta).toBe('texto');
        expect(guardado[0].textLabel).toBe('Oficina');

        const [vuelta] = buildRestoredItems({ annotations: guardado, source: new VectorSource(), measurementConfig: {} });
        expect(vuelta.type).toBe('Pin');
        expect(vuelta.feature.get('pinEtiqueta')).toBe('texto');
        expect(vuelta.label).toBe('Pin: Oficina\n20.67361, -103.34437');
    });

    it('el punto medido en 3D se guarda como pin', () => {
        expect(anotacionDeMedicion('punto', [GUADALAJARA])).toEqual({
            type: 'Pin',
            visible: true,
            geometry: { type: 'Point', coordinates: GUADALAJARA },
        });
        expect(anotacionDeMedicion('punto', [])).toBe(null);
    });

    it('en 3D solo se pintan como marcador los pines, textos y emojis visibles', () => {
        const linea = new Feature({ geometry: new LineString([[0, 0], [1, 1]]) });
        const mediciones = [
            { id: 'a', type: 'Pin', feature: pin() },
            { id: 'b', type: 'Text', feature: pin() },
            { id: 'c', type: 'Emoji', feature: pin(), visible: false },
            { id: 'd', type: 'LineString', feature: linea },
        ];
        expect(anotacionesPuntuales(mediciones).map(m => m.id)).toEqual(['a', 'b']);
    });
});
