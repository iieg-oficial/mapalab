import { useEffect } from 'react';
import { useMapDrawing } from '@hooksMaps/useMapDrawing';

export const CATALOGO_ANNOTATIONS_KEY = 'mapalab.catalogo.annotations';

const olvidar = (almacen) => {
    try {
        almacen().removeItem(CATALOGO_ANNOTATIONS_KEY);
    } catch {
        return;
    }
};

export const useMedicionesDelCatalogo = (mapRef, onPolygonComplete) => {
    useEffect(() => {
        olvidar(() => window.localStorage);
        return () => olvidar(() => window.sessionStorage);
    }, []);

    return useMapDrawing(mapRef, onPolygonComplete, null, { storageKey: CATALOGO_ANNOTATIONS_KEY, storageType: 'session' });
};
