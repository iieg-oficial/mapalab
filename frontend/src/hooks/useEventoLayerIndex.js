import { useMemo } from 'react';
import { buildEventoIndex } from '@pages/maps/helpers/eventoHelpers';


export const useEventoLayerIndex = (eventos, allLayers) => {
    return useMemo(
        () => buildEventoIndex(eventos, allLayers),
        [eventos, allLayers],
    );
};
