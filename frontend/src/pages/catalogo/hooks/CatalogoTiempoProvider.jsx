import { useMemo, useRef } from 'react';
import { CatalogoTiempoContext } from './catalogoTiempoContext';
import { useCatalogoTiempo } from './useCatalogoTiempo';
import { useCatalogoLoop } from './useCatalogoLoop';

export const CatalogoTiempoProvider = ({ capa, initialFecha = null, onFechaChange, children }) => {
    const wmsLayerRef = useRef(null);
    const tiempo = useCatalogoTiempo(capa, wmsLayerRef, { initialFecha, onFechaChange });
    const loop = useCatalogoLoop(tiempo);

    const value = useMemo(() => ({ tiempo, loop, wmsLayerRef }), [tiempo, loop]);

    return (
        <CatalogoTiempoContext.Provider value={value}>
            {children}
        </CatalogoTiempoContext.Provider>
    );
};
