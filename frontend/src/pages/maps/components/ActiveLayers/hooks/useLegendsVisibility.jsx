import { createContext, useCallback, useContext, useState } from 'react';

const STORAGE_KEY = 'mapalab.activeLayers.legendsVisible';

const LegendsVisibilityContext = createContext({ visible: true, setVisible: () => {} });

const readStored = () => {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        if (value === null) return true;
        return value === 'true';
    } catch {
        return true;
    }
};

export const LegendsVisibilityProvider = ({ children }) => {
    const [visible, setVisibleState] = useState(readStored);

    const setVisible = useCallback((next) => {
        const value = typeof next === 'function' ? next(visible) : next;
        setVisibleState(value);
        try { localStorage.setItem(STORAGE_KEY, String(value)); } catch { /* ignore */ }
    }, [visible]);

    return (
        <LegendsVisibilityContext.Provider value={{ visible, setVisible }}>
            {children}
        </LegendsVisibilityContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLegendsVisibility = () => useContext(LegendsVisibilityContext);
