import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { unByKey } from 'ol/Observable';
import { useMapsContext } from '@hooks/useMaps';
import { fetchSiluetas } from '@services/municipioService';
import { posicionBarraStore } from '@pages/maps/helpers/cifrasBarraStore';
import { lineaDeBarra, llavesDe, prepararMunicipios, repartir } from '@pages/maps/helpers/repartoBarra';

export const mapasDelSwipe = (paneMapInstances) => (
    Array.isArray(paneMapInstances) ? paneMapInstances : Object.values(paneMapInstances || {})
).filter(Boolean);

export const useRepartoBarra = (activo, claves = null) => {
    const { compareMode, paneMapInstances } = useMapsContext();
    const [municipios, setMunicipios] = useState(null);
    const [vista, setVista] = useState(0);
    const mapas = mapasDelSwipe(paneMapInstances);
    const mapa = mapas[0] || null;
    const posicionViva = useSyncExternalStore(posicionBarraStore.subscribe, posicionBarraStore.get);
    const posicion = posicionViva ?? compareMode?.swipePosition ?? 0.5;
    const horizontal = compareMode?.swipeOrientation === 'horizontal';

    useEffect(() => {
        if (!activo || municipios) return undefined;
        let cancelado = false;
        fetchSiluetas()
            .then(datos => { if (!cancelado) setMunicipios(prepararMunicipios(datos.municipios)); })
            .catch(() => { if (!cancelado) setMunicipios([]); });
        return () => { cancelado = true; };
    }, [activo, municipios]);

    useEffect(() => {
        if (!activo || !mapa) return undefined;
        const llave = mapa.on('moveend', () => setVista(v => v + 1));
        return () => unByKey(llave);
    }, [activo, mapa]);

    const reparto = useMemo(() => {
        if (!activo || !mapa || !municipios?.length) return null;
        const linea = lineaDeBarra(mapa, posicion, horizontal);
        return linea ? repartir(municipios, linea) : null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activo, mapa, municipios, posicion, horizontal, vista]);

    const firmaClaves = (claves || []).join(',');
    const permitidos = useMemo(() => {
        if (!firmaClaves || !municipios) return null;
        const elegidas = new Set(firmaClaves.split(','));
        return new Set(municipios.filter(m => elegidas.has(m.clave)).flatMap(llavesDe));
    }, [firmaClaves, municipios]);

    return { reparto, municipios, mapas, permitidos };
};
