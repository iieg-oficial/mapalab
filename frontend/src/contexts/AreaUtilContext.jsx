import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SIN_MARGENES = { left: 0, right: 0, top: 0, bottom: 0 };

const AREA_COMPLETA = { margenes: SIN_MARGENES, acoplado: false, fijarMargenes: () => {} };

const AreaUtilContext = createContext(AREA_COMPLETA);

export const AreaUtilProvider = ({ children }) => {
    const [margenes, setMargenes] = useState(SIN_MARGENES);

    const fijarMargenes = useCallback((siguientes) => {
        setMargenes(previos => {
            const nuevos = { ...SIN_MARGENES, ...siguientes };
            const igual = previos.left === nuevos.left
                && previos.right === nuevos.right
                && previos.top === nuevos.top
                && previos.bottom === nuevos.bottom;
            return igual ? previos : nuevos;
        });
    }, []);

    const acoplado = margenes.left > 0 || margenes.right > 0 || margenes.top > 0 || margenes.bottom > 0;

    const value = useMemo(
        () => ({ margenes, acoplado, fijarMargenes }),
        [margenes, acoplado, fijarMargenes],
    );

    return <AreaUtilContext.Provider value={value}>{children}</AreaUtilContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAreaUtil = () => useContext(AreaUtilContext);
