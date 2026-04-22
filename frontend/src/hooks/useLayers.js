import { useContext } from 'react';
import { LayersContext } from '@contexts/LayersContext';

export const useLayers = () => useContext(LayersContext);
