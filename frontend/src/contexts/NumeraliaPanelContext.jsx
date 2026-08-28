import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NumeraliaPanelContext = createContext(null);

const STORAGE_KEY = 'mapalab.numeralia.panelAbierto';
const STORAGE_MIN = 'mapalab.numeralia.panelMinimizado';
const MAX_COMPARADOS = 6;

const leerGuardado = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

const guardar = (valor) => {
    try {
        localStorage.setItem(STORAGE_KEY, String(valor));
    } catch {
        /* ignore */
    }
};

const leerMinimizado = () => {
    try {
        return localStorage.getItem(STORAGE_MIN) === 'true';
    } catch {
        return false;
    }
};

const guardarMinimizado = (valor) => {
    try {
        localStorage.setItem(STORAGE_MIN, String(valor));
    } catch {
        /* ignore */
    }
};

export const NumeraliaPanelProvider = ({ children }) => {
    const [detachedLayerId, setDetachedLayerId] = useState(null);
    const [modo, setModo] = useState('resumen');
    const [clavesComparadas, setClavesComparadas] = useState([]);
    const [highlight, setHighlight] = useState(0);

    const [abierto, setAbierto] = useState(leerGuardado);
    const [minimizado, setMinimizado] = useState(leerMinimizado);

    const detach = useCallback((layerId) => {
        setAbierto(true);
        guardar(true);
        if (layerId) setDetachedLayerId(layerId);
    }, []);
    const attach = useCallback(() => {
        setAbierto(false);
        guardar(false);
        setDetachedLayerId(null);
        setModo('resumen');
    }, []);
    const abrirModo = useCallback((siguiente) => {
        setModo(actual => (actual === siguiente ? 'resumen' : siguiente));
    }, []);
    const cerrarModo = useCallback(() => setModo('resumen'), []);
    const compararCon = useCallback((claves) => {
        setClavesComparadas(previas => {
            const unicas = [...new Set([...previas, ...claves.map(String)])];
            return unicas.slice(0, MAX_COMPARADOS);
        });
    }, []);
    const quitarComparado = useCallback((clave) => {
        setClavesComparadas(previas => previas.filter(c => c !== String(clave)));
    }, []);
    const seguir = useCallback((layerId) => {
        if (layerId) setDetachedLayerId(layerId);
    }, []);
    const alternarMinimizado = useCallback(() => setMinimizado(v => {
        guardarMinimizado(!v);
        return !v;
    }), []);
    const resaltar = useCallback(() => setHighlight(n => n + 1), []);

    const value = useMemo(
        () => ({
            abierto, minimizado, detachedLayerId, detach, attach, seguir, alternarMinimizado, resaltar, highlight,
            modo, abrirModo, cerrarModo, clavesComparadas, compararCon, quitarComparado,
        }),
        [
            abierto, minimizado, detachedLayerId, detach, attach, seguir, alternarMinimizado, resaltar, highlight,
            modo, abrirModo, cerrarModo, clavesComparadas, compararCon, quitarComparado,
        ],
    );

    return (
        <NumeraliaPanelContext.Provider value={value}>
            {children}
        </NumeraliaPanelContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNumeraliaPanel = () => useContext(NumeraliaPanelContext) || {};
