import { useContext } from 'react';
import EventoContext from '@contexts/EventoContext';

export const useEventoContext = () => {
    const context = useContext(EventoContext);
    if (!context) throw new Error('useEventoContext debe usarse dentro de un EventoProvider');
    return context;
};

const SIN_DECORACION = Object.freeze({ tema: null, slug: null, activa: false, alternar: () => {} });

export const useDecoracionEvento = () => useContext(EventoContext)?.decoracion ?? SIN_DECORACION;
