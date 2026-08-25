import { createContext, useCallback, useContext, useState } from 'react';

const STORAGE_KEY = 'mapalab.activeLayers.statsVisible';

const StatsVisibilityContext = createContext({ visible: false, setVisible: () => {} });

const readStored = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

export const StatsVisibilityProvider = ({ children }) => {
    const [visible, setVisibleState] = useState(readStored);

    const setVisible = useCallback((next) => {
        const value = typeof next === 'function' ? next(visible) : next;
        setVisibleState(value);
        try { localStorage.setItem(STORAGE_KEY, String(value)); } catch { /* ignore */ }
    }, [visible]);

    return (
        <StatsVisibilityContext.Provider value={{ visible, setVisible }}>
            {children}
        </StatsVisibilityContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStatsVisibility = () => useContext(StatsVisibilityContext);
