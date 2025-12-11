import { useContext } from 'react';
import MapsContext from '@contexts/MapsContext';

export const useMapsContext = () => {
    const context = useContext(MapsContext);
    if (!context) throw new Error('useMapsContext debe usarse dentro de un MapsContext');
    return context;
};