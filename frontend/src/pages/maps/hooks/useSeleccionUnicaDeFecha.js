import { useEffect, useState } from 'react';
import { findWMSConfig } from '../helpers/wmsConfig';
import { fetchGeometryType } from '@utils/featureInfoUtils';

export const useSeleccionUnicaDeFecha = (layerId, allLayers, isRaster) => {
    const [resultado, setResultado] = useState({ layerId: null, unica: false });

    useEffect(() => {
        if (!layerId || isRaster) return;
        const wmsConfig = findWMSConfig(layerId, allLayers);
        if (!wmsConfig) return;
        let cancelled = false;
        fetchGeometryType(wmsConfig.baseUrl, wmsConfig.layerName).then(type => {
            if (!cancelled) setResultado({ layerId, unica: type === 'polygon' });
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerId, isRaster]);

    return resultado.layerId === layerId && resultado.unica;
};
