import { createContext } from 'react';

export const LayersContext = createContext({
    layers: [],
    initialOrder: [],
    loading: true,
    error: null,
});
