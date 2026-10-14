import { useEffect } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';
import { MAPA_OSCURO, mapaAnterior, recordarMapaAnterior } from '@pages/maps/helpers/mapaBaseTema';

const SIN_MAPA = 'sin_mapalab';

const MapaBaseOscuro = () => {
    const decoracion = useDecoracionEvento();
    const { baseMapId, setBaseMapId } = useMapsContext();
    const activa = esDiaDeMuertos(decoracion);

    useEffect(() => {
        if (activa && mapaAnterior() === null && baseMapId !== MAPA_OSCURO) {
            recordarMapaAnterior(baseMapId);
            if (baseMapId !== SIN_MAPA) setBaseMapId(MAPA_OSCURO);
            return;
        }
        if (!activa && mapaAnterior() !== null) {
            if (baseMapId === MAPA_OSCURO) setBaseMapId(mapaAnterior());
            recordarMapaAnterior(null);
        }
    }, [activa, baseMapId, setBaseMapId]);

    return null;
};

export default MapaBaseOscuro;
