import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SIN_MARGENES = { left: 0, right: 0, bottom: 0 };

const AreaUtilContext = createContext(SIN_MARGENES);

export const AreaUtilProvider = ({ children }) => {
    const [margenes, setMargenes] = useState(SIN_MARGENES);

    const fijarMargenes = useCallback((siguientes) => {
        setMargenes(previos => {
            const nuevos = { ...SIN_MARGENES, ...siguientes };
            const igual = previos.left === nuevos.left
                && previos.right === nuevos.right
                && previos.bottom === nuevos.bottom;
            return igual ? previos : nuevos;
        });
    }, []);

    const value = useMemo(() => ({ margenes, fijarMargenes }), [margenes, fijarMargenes]);

    return <AreaUtilContext.Provider value={value}>{children}</AreaUtilContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAreaUtil = () => useContext(AreaUtilContext) || { margenes: SIN_MARGENES };
