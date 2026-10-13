import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';

const OSCURO = 'oscuro';
const SIN_MAPA = 'sin_mapalab';

const MapaBaseOscuro = () => {
    const decoracion = useDecoracionEvento();
    const { baseMapId, setBaseMapId } = useMapsContext();
    const activa = esDiaDeMuertos(decoracion);
    const anterior = useRef(null);

    useEffect(() => {
        if (activa && anterior.current === null && baseMapId !== OSCURO) {
            anterior.current = baseMapId;
            if (baseMapId !== SIN_MAPA) setBaseMapId(OSCURO);
            return;
        }
        if (!activa && anterior.current !== null) {
            if (baseMapId === OSCURO) setBaseMapId(anterior.current);
            anterior.current = null;
        }
    }, [activa, baseMapId, setBaseMapId]);

    return null;
};

export default MapaBaseOscuro;
