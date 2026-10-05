import { createContext, useContext } from 'react';

export const SesionContext = createContext({
    habilitada: false,
    usuario: null,
    capasPrivadas: 0,
    revision: 0,
    entrando: false,
    error: null,
    entrar: () => {},
    salir: () => {},
    limpiarError: () => {},
});

export const useSesion = () => useContext(SesionContext);
