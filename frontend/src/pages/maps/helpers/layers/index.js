import { economiaLayers } from './definitions/economia';
import { saludLayers } from './definitions/salud';
import { educacionLayers } from './definitions/educacion';
import { seguridadLayers } from './definitions/seguridad';
import { gobiernoLayers } from './definitions/gobierno';
import { recursosLayers } from './definitions/recursos';
import { demografiaLayers } from './definitions/demografia';
import { desarrolloLayers } from './definitions/desarrollo';
import { baseLayers } from './definitions/base';
import {
    findLayerById, getLayersWithWMS, validateLayer,
    loadLayerSymbology, loadMultipleLayersSymbology, getSymbologyStats,
    collectLayersWithWMS, collectLayerIdsWithWMS
} from './utils/layerHelpers';

export const layers = [
    baseLayers, demografiaLayers, saludLayers, economiaLayers, educacionLayers,
    recursosLayers, desarrolloLayers, seguridadLayers, gobiernoLayers
];

export {
    findLayerById, getLayersWithWMS, validateLayer,
    loadLayerSymbology, loadMultipleLayersSymbology, getSymbologyStats,
    collectLayersWithWMS, collectLayerIdsWithWMS
};

export const initializeLayersWithSymbology = async (layerIds = []) => {
    if (layerIds.length === 0) {
        const layersWithWMS = getLayersWithWMS(layers);
        return loadMultipleLayersSymbology(layersWithWMS);
    }

    const selectedLayers = layerIds.map(id => findLayerById(id, layers)).filter(Boolean);
    return loadMultipleLayersSymbology(selectedLayers);
};

if (import.meta.env.DEV) {
    layers.forEach(layer => {
        if (!validateLayer(layer)) {
            console.warn(`⚠️ Capa inválida detectada:`, layer);
        }
    });

    window.layerDebug = {
        getStats: () => getSymbologyStats(layers),
        loadSymbology: initializeLayersWithSymbology
    };
}
