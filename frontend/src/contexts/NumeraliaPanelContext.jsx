import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NumeraliaPanelContext = createContext(null);

export const NumeraliaPanelProvider = ({ children }) => {
    const [detachedLayerId, setDetachedLayerId] = useState(null);
    const [highlight, setHighlight] = useState(0);

    const [abierto, setAbierto] = useState(false);

    const detach = useCallback((layerId) => {
        setAbierto(true);
        if (layerId) setDetachedLayerId(layerId);
    }, []);
    const attach = useCallback(() => {
        setAbierto(false);
        setDetachedLayerId(null);
    }, []);
    const seguir = useCallback((layerId) => {
        if (layerId) setDetachedLayerId(layerId);
    }, []);
    const resaltar = useCallback(() => setHighlight(n => n + 1), []);

    const value = useMemo(
        () => ({ abierto, detachedLayerId, detach, attach, seguir, resaltar, highlight }),
        [abierto, detachedLayerId, detach, attach, seguir, resaltar, highlight],
    );

    return (
        <NumeraliaPanelContext.Provider value={value}>
            {children}
        </NumeraliaPanelContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNumeraliaPanel = () => useContext(NumeraliaPanelContext) || {};
