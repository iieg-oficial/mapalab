import { useMemo, useRef } from 'react';
import { CatalogoTiempoContext } from './catalogoTiempoContext';
import { useCatalogoTiempo } from './useCatalogoTiempo';
import { useCatalogoLoop } from './useCatalogoLoop';
import { useCatalogoMunicipio } from './useCatalogoMunicipio';

export const CatalogoTiempoProvider = ({ capa, initialFecha = null, onFechaChange, initialMunicipios = null, onMunicipiosChange, children }) => {
    const wmsLayerRef = useRef(null);
    const municipio = useCatalogoMunicipio(capa, { initialMunicipios, onMunicipiosChange });
    const tiempo = useCatalogoTiempo(capa, wmsLayerRef, { initialFecha, onFechaChange, filtroMunicipio: municipio.filtroMunicipio });
    const loop = useCatalogoLoop(tiempo);

    const value = useMemo(() => ({ tiempo, loop, wmsLayerRef, municipio }), [tiempo, loop, municipio]);

    return (
        <CatalogoTiempoContext.Provider value={value}>
            {children}
        </CatalogoTiempoContext.Provider>
    );
};
