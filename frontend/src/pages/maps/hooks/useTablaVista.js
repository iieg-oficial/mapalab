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
    const { mapRef, paneMapInstances } = useMapsContext();
    const { estadoDe, fijarVista } = useTablaAtributos();
    const { vista, bboxCongelado } = estadoDe(layerId);
    const [extentCrudo, setExtentCrudo] = useState(null);

    const siguiendo = vista === 'visible';
    const extentDebounced = useDebounce(extentCrudo, RETARDO_MOVIMIENTO);

    const resolverMapa = useCallback(
        () => mapRef?.current || paneMapInstances?.[0] || null,
        [mapRef, paneMapInstances],
    );

    useEffect(() => {
        const map = resolverMapa();
        if (!map || !siguiendo) return undefined;

        const medir = () => setExtentCrudo(extentDelMapa(map));
        medir();
        map.on('moveend', medir);
        return () => map.un('moveend', medir);
    }, [resolverMapa, siguiendo]);

    const alternarSeguimiento = useCallback(() => {
        fijarVista(layerId, vista === 'libre' ? 'visible' : 'libre');
    }, [fijarVista, layerId, vista]);

    const congelar = useCallback(() => {
        const actual = extentDebounced || extentDelMapa(resolverMapa());
        if (!actual) return;
        fijarVista(layerId, 'congelada', actual);
    }, [extentDebounced, fijarVista, layerId, resolverMapa]);

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
