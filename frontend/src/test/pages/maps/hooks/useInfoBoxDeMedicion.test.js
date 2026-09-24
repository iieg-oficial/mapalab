import { describe, it, expect, vi } from 'vitest';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { abrirInfoBoxDeLinea } from '@pages/maps/hooks/useInfoBoxDeMedicion';

describe('abrirInfoBoxDeLinea', () => {
    it('abre el InfoBox solo con la medicion, en el ultimo punto de la linea', () => {
        const geometria = new LineString([fromLonLat([-103.4, 20.6]), fromLonLat([-103.3, 20.7])]);
        const setSelectedFeatureInfo = vi.fn();
        const clickPosition = { updatePosition: vi.fn() };
        abrirInfoBoxDeLinea({ geometria, pixel: [10, 20], setSelectedFeatureInfo, clickPosition });
        expect(clickPosition.updatePosition).toHaveBeenCalledWith({ pixel: [10, 20] });
        const info = setSelectedFeatureInfo.mock.calls[0][0];
        expect(info.medicion).toBe(geometria);
        expect(info.results).toEqual([]);
        expect(info.lngLat.lng).toBeCloseTo(-103.3, 6);
    });
});
