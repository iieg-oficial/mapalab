import { wmsTileUrl } from './view3d';

export const DESDE_ZOOM_TESELAS = 10;
const HASTA_ZOOM_TESELAS = 16;
const TAMANO_TESELA = 512;
const FORMATO_TESELAS = 'application/vnd.mapbox-vector-tile';

const capaDeTesela = (nombre) => String(nombre || '').split(':').pop();

export const fuenteDeTeselas = (wmsConfig, nombre, cql) => ({
    type: 'vector',
    tiles: [wmsTileUrl(wmsConfig.baseUrl, {
        LAYERS: nombre,
        STYLES: '',
        FORMAT: FORMATO_TESELAS,
        ...(cql ? { CQL_FILTER: cql } : {}),
    }, TAMANO_TESELA)],
    tileSize: TAMANO_TESELA,
    minzoom: DESDE_ZOOM_TESELAS,
    maxzoom: HASTA_ZOOM_TESELAS,
});

export const ajustesDeTeselas = (nombre) => ({
    'source-layer': capaDeTesela(nombre),
    minzoom: DESDE_ZOOM_TESELAS,
});

export const LAYOUT_TESELAS = {
    'icon-allow-overlap': false,
    'icon-ignore-placement': false,
    'icon-padding': 0,
};
