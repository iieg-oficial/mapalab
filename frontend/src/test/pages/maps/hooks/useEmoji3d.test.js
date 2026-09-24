import { describe, it, expect } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { anotacionDeEmoji } from '@pages/maps/hooks/useEmoji3d';
import { elementoDeAnotacion } from '@pages/maps/hooks/useAnotacionesPuntuales3d';

const emoji = () => {
    const feature = new Feature(new Point(fromLonLat([-103.3, 20.6])));
    feature.set('symbolPayload', { kind: 'emoji', value: '🌮' });
    return { type: 'Emoji', feature };
};

describe('emojis en 3D', () => {
    it('arma la anotación que restaura el visor', () => {
        const anotacion = anotacionDeEmoji({ kind: 'emoji', value: '🌮' }, [-103.3, 20.6]);
        expect(anotacion).toMatchObject({ type: 'Emoji', textLabel: '🌮', geometry: { type: 'Point', coordinates: [-103.3, 20.6] } });
    });

    it('con poste se ancla abajo y lleva el poste bajo el emoji', () => {
        const { elemento, anchor } = elementoDeAnotacion(emoji(), 'poste');
        expect(anchor).toBe('bottom');
        expect(elemento.children).toHaveLength(2);
        expect(elemento.textContent).toBe('🌮');
    });

    it('de frente queda centrado como antes', () => {
        const { elemento, anchor } = elementoDeAnotacion(emoji(), 'frente');
        expect(anchor).toBe('center');
        expect(elemento.children).toHaveLength(1);
    });
});
