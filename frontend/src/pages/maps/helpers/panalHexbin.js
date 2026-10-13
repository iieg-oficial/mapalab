import {
    bboxCql, containsExtent, createHexbinLayer, createWorkerWfsSource, expandExtent, fromCellProvider, fromVectorSource,
    lonLatToMercatorExtent
} from '@ghegar/panal/ol';
import { getWfsUrl } from '@utils/featureInfoUtils';
import { countVectorFeatures } from '@services/vectorLayerService';
import { HEXBIN_MAX_RESOLUTION, HEXBIN_RESOLUTION_BY_ZOOM } from '@constants/hexbin';
import { fetchAggregatedCells, PRECOMPUTED_RESOLUTIONS } from '@services/hexbinAggregateService';
import { hexbinStyle, HEXBIN_CLASSES } from './hexbinStyles';
import { OPCIONES_HEXBIN_BASE } from './hexbinOpciones';

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

export const TOPE_VISTA = 50000;
const MARGEN_VISTA = 0.25;

export class Acercate extends Error {
    constructor(total, limite) {
        super('demasiados puntos en la vista');
        this.name = 'Acercate';
        this.total = total;
        this.limite = limite;
    }
}

export const fuenteVista = ({ worker, wmsConfig, cqlFilter, geometria, opciones = OPCIONES_HEXBIN_BASE, contar = countVectorFeatures, tope = TOPE_VISTA }) => {
    const cql = cqlFilter || undefined;
    const wfs = createWorkerWfsSource(worker, {
        url: getWfsUrl(wmsConfig.baseUrl || ''),
        typeName: wmsConfig.wfsLayerName || wmsConfig.layerName,
        cql,
        bbox: { geometryName: geometria, margin: MARGEN_VISTA },
        maxFeatures: tope,
        pageSize: 10000,
        reducer: opciones.reductor,
        value: opciones.campo ?? undefined
    });
    let cubierta = null;

    return {
        kind: 'cells',
        resolutions: null,
        extentDependent: true,
        debounce: 250,
        rollup: null,
        listenChanges: wfs.listenChanges,
        loadMembers: wfs.loadMembers,
        release: wfs.release,
        setReducer: wfs.setReducer,
        load: async (request) => {
            const vista = lonLatToMercatorExtent(request.extent);
            if (!cubierta || !containsExtent(cubierta, vista)) {
                const pedida = expandExtent(vista, MARGEN_VISTA);
                const total = await contar(wmsConfig, bboxCql(geometria, pedida, cql), request.signal);
                if (total !== null && total > tope) {
                    cubierta = null;
                    throw new Acercate(total, tope);
                }
                cubierta = pedida;
            }
            return wfs.load(request);
        }
    };
};

export const crearHexbin = ({ map, source, layerId, zIndex, opacity, paletteIndex = 0, opciones = OPCIONES_HEXBIN_BASE }) => {
    let layer = null;
    const hexbin = createHexbinLayer({
        map,
        source,
        style: (_, { classIndex, selected }) => hexbinStyle(classIndex, {
            selectedCell: selected,
            paletteIndex: layer?.get('paletteIndex') || 0,
            relleno: layer?.get('rellenoActivo') !== false
        }),
        classification: { method: opciones.metodo, classes: HEXBIN_CLASSES },
        reducer: opciones.reductor,
        value: opciones.campo ?? undefined,
        resolution: { table: TABLA_RESOLUCION, hysteresis: 0.3, latitudeCorrection: false },
        layerOptions: { zIndex, opacity, properties: { layerId, paletteIndex, [HEXBIN_LAYER_FLAG]: true } }
    });
    layer = hexbin.layer;
    layer.set(PANAL_KEY, hexbin);
    return hexbin;
};

export const hexbinDeCapa = (layer) => layer?.get?.(PANAL_KEY) || null;

export const estadisticasHexbin = (hexbin, opciones = OPCIONES_HEXBIN_BASE) => {
    const { classification, legend, cellCount } = hexbin.getSnapshot();
    return {
        legend,
        enteros: opciones.reductor === 'count',
        max: classification?.stats?.max ?? 0,
        cells: cellCount,
        paletteIndex: hexbin.layer.get('paletteIndex') || 0
    };
};
