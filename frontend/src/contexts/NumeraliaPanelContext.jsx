import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NumeraliaPanelContext = createContext(null);

export const NumeraliaPanelProvider = ({ children }) => {
    const [detachedLayerId, setDetachedLayerId] = useState(null);

    const detach = useCallback((layerId) => setDetachedLayerId(layerId || null), []);
    const attach = useCallback(() => setDetachedLayerId(null), []);

    const value = useMemo(
        () => ({ detachedLayerId, detach, attach }),
        [detachedLayerId, detach, attach],
    );

    return (
        <NumeraliaPanelContext.Provider value={value}>
            {children}
        </NumeraliaPanelContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNumeraliaPanel = () => useContext(NumeraliaPanelContext) || {};
