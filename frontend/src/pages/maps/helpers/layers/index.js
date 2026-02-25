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
    findLayerById, validateLayer,
    getSymbologyStats,
    collectLayersWithWMS, collectLayerIdsWithWMS,
    getAllChildLayerIds, findParentGroup
} from './utils/layerHelpers';

export const layers = [
    baseLayers, demografiaLayers, saludLayers, economiaLayers, educacionLayers,
    recursosLayers, desarrolloLayers, seguridadLayers, gobiernoLayers
];

export {
    findLayerById, validateLayer,
    getSymbologyStats,
    collectLayersWithWMS, collectLayerIdsWithWMS,
    getAllChildLayerIds, findParentGroup
};
