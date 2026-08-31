import { useEffect, useState } from 'react';
import { fetchConfigColumnas } from '@services/tablaAtributosService';

export const useColumnasConfig = (layerId) => {
    const [configuracion, setConfiguracion] = useState([]);

    useEffect(() => {
        if (!layerId) {
            setConfiguracion([]);
            return undefined;
        }

        const controlador = new AbortController();
        fetchConfigColumnas(layerId, controlador.signal)
            .then(setConfiguracion)
            .catch(() => setConfiguracion([]));

        return () => controlador.abort();
    }, [layerId]);

    return configuracion;
};
