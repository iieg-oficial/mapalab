import { BASEMAPS } from '@pages/maps/helpers/basemaps';
import { SERVICE_WMS } from '@pages/maps/helpers/serviceMode';

export const CONTEXTO_3D = {
    basemaps: BASEMAPS,
    getServiceMode: () => SERVICE_WMS,
};
