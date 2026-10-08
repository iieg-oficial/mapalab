import { describe, it, expect } from 'vitest';
import { fromLonLat } from 'ol/proj';
import { ubicacionDeFeature } from '@pages/maps/helpers/featureGeometry';
import { buildCardPlan } from '@utils/infoboxPlan';

const CLIC = { lat: 20.5, lng: -103.5 };
const cerca = (a, b) => Math.abs(a - b) < 1e-9;

describe('ubicacionDeFeature', () => {
    it('usa la coordenada del punto', () => {
        const feature = { geometry: { type: 'Point', coordinates: fromLonLat([-103.3475, 20.6767]) } };
        const { lat, lng } = ubicacionDeFeature(feature, CLIC);
        expect(cerca(lat, 20.6767) && cerca(lng, -103.3475)).toBe(true);
    });

    it('acepta un MultiPoint de un solo punto', () => {
        const feature = { geometry: { type: 'MultiPoint', coordinates: [fromLonLat([-103.3, 20.6])] } };
        expect(cerca(ubicacionDeFeature(feature, CLIC).lat, 20.6)).toBe(true);
    });

    it('cae al clic con polígonos o sin geometría', () => {
        expect(ubicacionDeFeature({ geometry: { type: 'Polygon', coordinates: [] } }, CLIC)).toBe(CLIC);
        expect(ubicacionDeFeature({ properties: {} }, CLIC)).toBe(CLIC);
        expect(ubicacionDeFeature(null)).toBeNull();
    });
});

describe('link de ubicacion en la tarjetita', () => {
    const cfg = { iconText: [{ icon: 'ubicacion', field: 'direccion' }] };
    const props = { direccion: 'Av. Juárez 123' };
    const href = (opciones) => buildCardPlan(props, cfg, opciones).blocks[0].items[0].href;

    it('manda coordenadas cuando las hay', () => {
        expect(href({ coords: { lat: 20.6767, lng: -103.3475 } }))
            .toBe('https://www.google.com/maps/search/?api=1&query=20.676700%2C-103.347500');
    });

    it('sin coordenadas conserva la dirección', () => {
        expect(href({})).toBe('https://www.google.com/maps/search/?api=1&query=Av.%20Ju%C3%A1rez%20123');
    });
});
