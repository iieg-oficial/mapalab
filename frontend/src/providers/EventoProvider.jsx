import { useCallback, useMemo, useState } from 'react';
import EventoContext from '@contexts/EventoContext';
import { useMapsContext } from '@hooks/useMaps';
import { useEventos } from '@hooks/useEventos';
import { useEventoLayerIndex } from '@hooks/useEventoLayerIndex';
import { decoracionDeEventos } from '@pages/maps/helpers/eventoDiversion';


const EventoProvider = ({ children }) => {
    const { allLayers } = useMapsContext();
    const { eventos, loading, error } = useEventos();
    const { eventoByLayerId, layerIdsByEvento, aliasByLayerId } = useEventoLayerIndex(eventos, allLayers);

    const [activeEvento, setActiveEvento] = useState(null);
    const [decoracionEncendida, setDecoracionEncendida] = useState(false);
    const alternarDecoracion = useCallback(() => setDecoracionEncendida((v) => !v), []);
    const decoracion = useMemo(() => {
        const evento = decoracionDeEventos(eventos);
        return {
            tema: evento?.decoracion || null,
            slug: evento?.slug || null,
            activa: Boolean(evento) && decoracionEncendida,
            alternar: alternarDecoracion,
        };
    }, [eventos, decoracionEncendida, alternarDecoracion]);

    const findEventoByLayerId = useCallback(
        (layerId) => eventoByLayerId.get(layerId) || null,
        [eventoByLayerId],
    );
    const getLayerIdsByEvento = useCallback(
        (eventoId) => layerIdsByEvento.get(eventoId) || new Set(),
        [layerIdsByEvento],
    );
    const getAliasByLayerId = useCallback(
        (layerId) => aliasByLayerId.get(layerId) || null,
        [aliasByLayerId],
    );

    const value = useMemo(() => ({
        eventos,
        loading,
        error,
        activeEvento,
        setActiveEvento,
        findEventoByLayerId,
        getLayerIdsByEvento,
        getAliasByLayerId,
        decoracion,
    }), [eventos, loading, error, activeEvento, findEventoByLayerId, getLayerIdsByEvento, getAliasByLayerId, decoracion]);

    return (
        <EventoContext.Provider value={value}>
            {children}
        </EventoContext.Provider>
    );
};

export default EventoProvider;
