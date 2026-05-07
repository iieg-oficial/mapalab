import { useCallback, useMemo, useState } from 'react';
import EventoContext from '@contexts/EventoContext';
import { useMapsContext } from '@hooks/useMaps';
import { useEventos } from '@hooks/useEventos';
import { useEventoLayerIndex } from '@hooks/useEventoLayerIndex';


const EventoProvider = ({ children }) => {
    const { allLayers } = useMapsContext();
    const { eventos, loading, error } = useEventos();
    const { eventoByLayerId, layerIdsByEvento } = useEventoLayerIndex(eventos, allLayers);

    const [activeEvento, setActiveEvento] = useState(null);

    const findEventoByLayerId = useCallback(
        (layerId) => eventoByLayerId.get(layerId) || null,
        [eventoByLayerId],
    );
    const getLayerIdsByEvento = useCallback(
        (eventoId) => layerIdsByEvento.get(eventoId) || new Set(),
        [layerIdsByEvento],
    );

    const value = useMemo(() => ({
        eventos,
        loading,
        error,
        activeEvento,
        setActiveEvento,
        findEventoByLayerId,
        getLayerIdsByEvento,
    }), [eventos, loading, error, activeEvento, findEventoByLayerId, getLayerIdsByEvento]);

    return (
        <EventoContext.Provider value={value}>
            {children}
        </EventoContext.Provider>
    );
};

export default EventoProvider;
