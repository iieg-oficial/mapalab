import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NumeraliaPanelContext = createContext(null);

const STORAGE_KEY = 'mapalab.numeralia.panelAbierto';
const STORAGE_MIN = 'mapalab.numeralia.panelMinimizado';

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
        () => ({ abierto, minimizado, detachedLayerId, detach, attach, seguir, alternarMinimizado, resaltar, highlight }),
        [abierto, minimizado, detachedLayerId, detach, attach, seguir, alternarMinimizado, resaltar, highlight],
    );

    return (
        <NumeraliaPanelContext.Provider value={value}>
            {children}
        </NumeraliaPanelContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNumeraliaPanel = () => useContext(NumeraliaPanelContext) || {};
