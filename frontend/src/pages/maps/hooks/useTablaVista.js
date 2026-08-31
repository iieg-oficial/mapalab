import { useCallback, useEffect, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useDebounce } from '@hooks/useDebounce';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const RETARDO_MOVIMIENTO = 350;

export const SRS_VISTA = 'EPSG:3857';

const extentDelMapa = (map) => {
    const view = map?.getView?.();
    const size = map?.getSize?.();
    if (!view || !size) return null;
    const extent = view.calculateExtent(size);
    return Array.isArray(extent) && extent.every(Number.isFinite) ? extent : null;
};

export const useTablaVista = (layerId) => {
    const { mapRef } = useMapsContext();
    const { estadoDe, fijarVista } = useTablaAtributos();
    const { vista, bboxCongelado } = estadoDe(layerId);
    const [extentCrudo, setExtentCrudo] = useState(null);

    const siguiendo = vista === 'visible';
    const extentDebounced = useDebounce(extentCrudo, RETARDO_MOVIMIENTO);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map || !siguiendo) return undefined;

        const medir = () => setExtentCrudo(extentDelMapa(map));
        medir();
        map.on('moveend', medir);
        return () => map.un('moveend', medir);
    }, [mapRef, siguiendo]);

    const alternarSeguimiento = useCallback(() => {
        fijarVista(layerId, siguiendo ? 'libre' : 'visible');
    }, [fijarVista, layerId, siguiendo]);

    const congelar = useCallback(() => {
        const actual = extentDebounced || extentDelMapa(mapRef?.current);
        if (!actual) return;
        fijarVista(layerId, 'congelada', actual);
    }, [extentDebounced, fijarVista, layerId, mapRef]);

    const descongelar = useCallback(() => fijarVista(layerId, 'visible'), [fijarVista, layerId]);

    const extent = siguiendo ? extentDebounced : (vista === 'congelada' ? bboxCongelado : null);

    return {
        vista,
        extent,
        srs: SRS_VISTA,
        recalculando: siguiendo && extentCrudo !== extentDebounced,
        alternarSeguimiento,
        congelar,
        descongelar,
    };
};
