import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NumeraliaPanelContext = createContext(null);

export const NumeraliaPanelProvider = ({ children }) => {
    const [detachedLayerId, setDetachedLayerId] = useState(null);
    const [highlight, setHighlight] = useState(0);

    const detach = useCallback((layerId) => setDetachedLayerId(layerId || null), []);
    const attach = useCallback(() => setDetachedLayerId(null), []);
    const resaltar = useCallback(() => setHighlight(n => n + 1), []);

    const value = useMemo(
        () => ({ detachedLayerId, detach, attach, resaltar, highlight }),
        [detachedLayerId, detach, attach, resaltar, highlight],
    );

    return (
        <NumeraliaPanelContext.Provider value={value}>
            {children}
        </NumeraliaPanelContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNumeraliaPanel = () => useContext(NumeraliaPanelContext) || {};
