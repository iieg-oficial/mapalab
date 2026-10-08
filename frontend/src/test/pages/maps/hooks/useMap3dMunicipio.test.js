import { describe, it, expect } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { coleccionMunicipio, limitesDeSeleccion } from '@pages/maps/hooks/useMap3dMunicipio';

const cuadro = (lng, lat, d) => new Polygon([[[lng, lat], [lng + d, lat], [lng + d, lat + d], [lng, lat + d], [lng, lat]].map(c => fromLonLat(c))]);

describe('municipio en 3D', () => {
    it('arma el velo con el hueco del municipio y su contorno', () => {
        const coleccion = coleccionMunicipio([cuadro(-103.5, 20.5, 0.2)]);
        const roles = coleccion.features.map(f => f.properties.rol);
        expect(roles).toEqual(['velo', 'contorno']);
        expect(coleccion.features[0].geometry.coordinates).toHaveLength(2);
    });

    it('sin selección no dibuja nada', () => {
        expect(coleccionMunicipio([]).features).toEqual([]);
        expect(limitesDeSeleccion([])).toBeNull();
    });

    it('los límites cubren todos los municipios en lon/lat', () => {
        const [[oeste, sur], [este, norte]] = limitesDeSeleccion([cuadro(-103.5, 20.5, 0.2), cuadro(-102.8, 21, 0.3)]);
        expect(oeste).toBeCloseTo(-103.5, 5);
        expect(este).toBeCloseTo(-102.5, 5);
        expect(sur).toBeCloseTo(20.5, 5);
        expect(norte).toBeCloseTo(21.3, 5);
    });
});
