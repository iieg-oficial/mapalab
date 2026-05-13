import { useContext } from 'react';
import EventoContext from '@contexts/EventoContext';

export const useEventoContext = () => {
    const context = useContext(EventoContext);
    if (!context) throw new Error('useEventoContext debe usarse dentro de un EventoProvider');
    return context;
};
