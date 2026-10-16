import { describe, it, expect, vi } from 'vitest';

vi.mock('@pages/catalogo/hooks/useCatalogoTabla', () => ({ idTablaCatalogo: (capa) => capa.id }));

import { buildWmsLayer } from '@pages/catalogo/helpers/catalogoMapLayer';
import { get as getProjection } from 'ol/proj';

const capa = { id: 'unidades_salud', geoserverWorkspace: 'salud', geoserverLayer: 'unidades_salud', antialias: 'text' };

describe('buildWmsLayer', () => {
    it('manda antialias en FORMAT_OPTIONS para que OpenLayers le sume el dpi', () => {
        const source = buildWmsLayer(capa).getSource();
        expect(source.getParams().FORMAT_OPTIONS).toBe('antialias:text');
        expect(source.getParams()).not.toHaveProperty('format_options');
    });

    it('no duplica la clave en pantallas de alta densidad', () => {
        const source = buildWmsLayer(capa).getSource();
        const image = source.getImage([0, 0, 1000, 1000], 1, 2, getProjection('EPSG:3857'));
        image.load();
        const url = image.getImage().src;
        const keys = [...new URL(url).searchParams.keys()].filter(k => k.toLowerCase() === 'format_options');
        expect(keys).toEqual(['FORMAT_OPTIONS']);
        expect(new URL(url).searchParams.get('FORMAT_OPTIONS')).toBe('antialias:text;dpi:180');
    });
});
