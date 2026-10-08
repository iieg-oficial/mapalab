import { describe, it, expect } from 'vitest';
import { DESDE_ZOOM_TESELAS, ajustesDeTeselas, fuenteDeTeselas } from '@pages/maps/helpers/teselasDePuntos';

const WMS = { baseUrl: 'https://iieg.test/sextante/seguridad/wms' };

describe('teselas vectoriales de puntos', () => {
    it('pide a GeoServer teselas MVT de 512 con el filtro de la capa', () => {
        const fuente = fuenteDeTeselas(WMS, 'seguridad:delitos_fiscalia_robo_persona', "fecha >= '2025-01-01'");
        const [url] = fuente.tiles;
        expect(fuente).toMatchObject({ type: 'vector', tileSize: 512, minzoom: DESDE_ZOOM_TESELAS });
        expect(url).toContain('FORMAT=application%2Fvnd.mapbox-vector-tile');
        expect(url).toContain('WIDTH=512');
        expect(url).toContain('CQL_FILTER=fecha');
        expect(url).toContain('BBOX={bbox-epsg-3857}');
    });

    it('sin filtro no manda CQL y la capa lee el nombre sin workspace', () => {
        expect(fuenteDeTeselas(WMS, 'seguridad:robo', null).tiles[0]).not.toContain('CQL_FILTER');
        expect(ajustesDeTeselas('seguridad:robo')).toEqual({ 'source-layer': 'robo', minzoom: DESDE_ZOOM_TESELAS });
    });
});
