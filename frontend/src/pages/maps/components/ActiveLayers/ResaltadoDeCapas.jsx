import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { useResaltadoCapa } from '@pages/maps/hooks/useResaltadoCapa';

const ResaltadoDeCapas = () => {
    const { mapRef, paneMapInstances, compareMode, cancelPulse } = useMapsContext();
    const { layers } = useLayers();
    useResaltadoCapa({ mapRef, paneMapInstances, compareMode, allLayers: layers, cancelPulse });
    return null;
};

export default ResaltadoDeCapas;
