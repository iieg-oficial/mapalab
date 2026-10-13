import { createHexbinLayer, fromCellProvider, fromVectorSource } from '@ghegar/panal/ol';
import { HEXBIN_MAX_RESOLUTION, HEXBIN_RESOLUTION_BY_ZOOM } from '@constants/hexbin';
import { fetchAggregatedCells, PRECOMPUTED_RESOLUTIONS } from '@services/hexbinAggregateService';
import { hexbinStyle, HEXBIN_CLASSES } from './hexbinStyles';

export const HEXBIN_LAYER_FLAG = 'mapalabHexbin';
export const PANAL_KEY = 'panalHexbin';

export const TABLA_RESOLUCION = [
    ...HEXBIN_RESOLUTION_BY_ZOOM,
    { maxZoom: Infinity, resolution: HEXBIN_MAX_RESOLUTION }
];

export class SinPrecalculado extends Error {
    constructor() {
        super('sin celdas precalculadas');
        this.name = 'SinPrecalculado';
    }
}

export const fuentePrecalculada = (layerKeys) => fromCellProvider({
    resolutions: [...PRECOMPUTED_RESOLUTIONS],
    load: async ({ resolution, signal }) => {
        const celdas = await fetchAggregatedCells(layerKeys, resolution, signal);
        if (!celdas?.length) throw new SinPrecalculado();
        return celdas;
    }
});

export const fuenteLocal = (vectorSource) => fromVectorSource(vectorSource);

export const crearHexbin = ({ map, source, layerId, zIndex, opacity, paletteIndex = 0 }) => {
    let layer = null;
    const hexbin = createHexbinLayer({
        map,
        source,
        style: (_, { classIndex, selected }) => hexbinStyle(classIndex, {
            selectedCell: selected,
            paletteIndex: layer?.get('paletteIndex') || 0,
            relleno: layer?.get('rellenoActivo') !== false
        }),
        classification: { method: 'quantile', classes: HEXBIN_CLASSES },
        resolution: { table: TABLA_RESOLUCION, hysteresis: 0.3, latitudeCorrection: false },
        layerOptions: { zIndex, opacity, properties: { layerId, paletteIndex, [HEXBIN_LAYER_FLAG]: true } }
    });
    layer = hexbin.layer;
    layer.set(PANAL_KEY, hexbin);
    return hexbin;
};

export const hexbinDeCapa = (layer) => layer?.get?.(PANAL_KEY) || null;

export const estadisticasHexbin = (hexbin) => {
    const { classification, legend, cellCount } = hexbin.getSnapshot();
    return {
        legend,
        max: classification?.stats?.max ?? 0,
        cells: cellCount,
        paletteIndex: hexbin.layer.get('paletteIndex') || 0
    };
};
