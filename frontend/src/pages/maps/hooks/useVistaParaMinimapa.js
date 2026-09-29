import { useEffect, useState } from 'react';
import { fetchSiluetas } from '@services/municipioService';
import { sigueVisible } from '@pages/maps/helpers/minimapa';

const leerVista = (map) => {
    const vista = map?.getView?.();
    const tamano = map?.getSize?.();
    if (!vista || !tamano) return null;
    const centro = vista.getCenter();
    const zoom = vista.getZoom();
    if (!centro || !Number.isFinite(zoom)) return null;
    return { centro, zoom, extension: vista.calculateExtent(tamano) };
};

const ESPERA_MAPA_MS = 250;

export const useVistaParaMinimapa = (mapRef, paneMapInstances, activo) => {
    const [vista, setVista] = useState(null);
    const [visible, setVisible] = useState(false);
    const [siluetas, setSiluetas] = useState(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        if (!activo) return undefined;
        const buscar = () => paneMapInstances?.[0] || mapRef?.current || null;
        const encontrado = buscar();
        if (encontrado) {
            setMap(encontrado);
            return undefined;
        }
        const intervalo = setInterval(() => {
            const siguiente = buscar();
            if (!siguiente) return;
            clearInterval(intervalo);
            setMap(siguiente);
        }, ESPERA_MAPA_MS);
        return () => clearInterval(intervalo);
    }, [mapRef, paneMapInstances, activo]);

    useEffect(() => {
        if (!activo || !map) return undefined;
        const actualizar = () => {
            const nueva = leerVista(map);
            setVista(nueva);
            setVisible(previo => sigueVisible(previo, nueva?.zoom));
        };
        actualizar();
        map.on('moveend', actualizar);
        return () => map.un('moveend', actualizar);
    }, [map, activo]);

    useEffect(() => {
        if (!activo || !visible || siluetas) return undefined;
        let vigente = true;
        fetchSiluetas()
            .then((datos) => { if (vigente) setSiluetas(datos); })
            .catch(() => { if (vigente) setSiluetas(null); });
        return () => { vigente = false; };
    }, [activo, visible, siluetas]);

    return { vista, visible: activo && visible, siluetas, map };
};
