import { BASEMAPS } from '@pages/maps/helpers/basemaps';
import { SERVICE_HEXBIN, SERVICE_WMS } from '@pages/maps/helpers/serviceMode';

export const contexto3d = (enHexagonos) => ({
    basemaps: BASEMAPS,
    getServiceMode: () => (enHexagonos ? SERVICE_HEXBIN : SERVICE_WMS),
});
