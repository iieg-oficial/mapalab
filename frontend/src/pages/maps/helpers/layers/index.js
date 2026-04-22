import { baseLayers } from './definitions/base';
import { demografiaLayers } from './definitions/demografia';
import { saludLayers } from './definitions/salud';
import { economiaLayers } from './definitions/economia';
import { educacionLayers } from './definitions/educacion';
import { recursosLayers } from './definitions/recursos';
import { desarrolloLayers } from './definitions/desarrollo';
import { seguridadLayers } from './definitions/seguridad';
import { gobiernoLayers } from './definitions/gobierno';

export const layers = [
    baseLayers, demografiaLayers, saludLayers, economiaLayers, educacionLayers,
    recursosLayers, desarrolloLayers, seguridadLayers, gobiernoLayers
];

export { findLayerById } from './utils/layerHelpers';
