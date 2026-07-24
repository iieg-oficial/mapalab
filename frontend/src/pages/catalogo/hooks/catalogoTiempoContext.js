import { createContext, useContext } from 'react';

export const CatalogoTiempoContext = createContext(null);

export const useCatalogoTiempoContext = () => useContext(CatalogoTiempoContext);
