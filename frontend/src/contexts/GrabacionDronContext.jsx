import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDron } from '@contexts/DronContext';
import { useGrabarVuelo } from '@hooksMaps/useGrabarVuelo';
import { useMapDownload } from '@mapsComponents/MapExport/hooks/useMapDownload';
import { largoDeRuta } from '@pages/maps/helpers/dron/minimapaDron';
import { exportarRecorrido } from '@pages/maps/helpers/dron/exportarRecorrido';
import { basemapTileUrl } from '@pages/maps/helpers/view3d';
import { useMapsContext } from '@hooks/useMaps';
import { triggerDownload } from '@services/downloadService';

const RESALTE_MS = 6000;
const NADA = () => {};
const INACTIVA = {
    grabando: false,
    segundos: 0,
    tope: 0,
    topeActual: 0,
    error: null,
    tarjeta: { abierta: false, resaltar: false },
    abrirTarjeta: NADA,
    cerrarTarjeta: NADA,
    puntos: 0,
    grabar: NADA,
    detener: NADA,
    descargarPng: NADA,
};

const GrabacionDronContext = createContext(null);

export const GrabacionDronProvider = ({ children }) => {
    const { ruta, rutaRef, cambiarRuta, telemetriaRef, rastroRef, perfil, config } = useDron();
    const { layersWithLegends, selectedLayer } = useMapDownload();
    const { basemaps, baseMapId } = useMapsContext();
    const plantilla = basemapTileUrl(basemaps?.[baseMapId]?.tiles);
    const capa = selectedLayer || layersWithLegends[0];
    const grabacion = useGrabarVuelo({
        titulo: capa?.label || capa?.name || 'Vuelo en dron',
        totalCapas: layersWithLegends.length,
        leerRastro: () => rastroRef.current,
    });
    const [tarjeta, setTarjeta] = useState({ abierta: false, resaltar: false });
    const conRutaRef = useRef(false);

    const abrirTarjeta = useCallback((resaltar = false) => setTarjeta({ abierta: true, resaltar }), []);
    const cerrarTarjeta = useCallback(() => setTarjeta({ abierta: false, resaltar: false }), []);

    useEffect(() => {
        if (!tarjeta.resaltar) return undefined;
        const fin = setTimeout(() => setTarjeta(previa => ({ ...previa, resaltar: false })), RESALTE_MS);
        return () => clearTimeout(fin);
    }, [tarjeta.resaltar]);

    const { grabando, detener } = grabacion;
    useEffect(() => {
        if (grabando && conRutaRef.current && ruta.puntos.length === 0) detener();
    }, [grabando, detener, ruta.puntos.length]);

    const grabar = useCallback((camara, contenedor) => {
        const actual = rutaRef.current;
        cerrarTarjeta();
        conRutaRef.current = actual.puntos.length > 0 && !actual.ciclo;
        if (actual.puntos.length && actual.pausada) cambiarRuta({ pausada: false });
        const t = telemetriaRef.current;
        const kmh = perfil.vel[config.velocidad];
        const estimadoS = conRutaRef.current && t && kmh > 0 ? largoDeRuta(t.dron.lngLat, actual.puntos) / (kmh / 3.6) : null;
        grabacion.grabar(camara, contenedor, { estimadoS });
    }, [grabacion, rutaRef, cambiarRuta, telemetriaRef, perfil, config.velocidad, cerrarTarjeta]);

    const descargarPng = useCallback(async () => {
        const t = telemetriaRef.current;
        if (!t) return;
        const datos = { dron: t.dron, ruta: rutaRef.current, rastro: [...rastroRef.current], aeronave: perfil.nombre };
        const imagen = await exportarRecorrido({ ...datos, plantilla }).catch(() => exportarRecorrido({ ...datos, plantilla: null }));
        if (imagen) triggerDownload(imagen, `recorrido-dron-${new Date().toISOString().slice(0, 10)}.png`);
        cerrarTarjeta();
    }, [telemetriaRef, rutaRef, rastroRef, perfil.nombre, plantilla, cerrarTarjeta]);

    const value = useMemo(() => ({
        grabando: grabacion.grabando,
        segundos: grabacion.segundos,
        tope: grabacion.tope,
        topeActual: grabacion.topeActual,
        error: grabacion.error,
        tarjeta,
        abrirTarjeta,
        cerrarTarjeta,
        grabar,
        detener: grabacion.detener,
        descargarPng,
        puntos: ruta.puntos.length,
    }), [grabacion, tarjeta, abrirTarjeta, cerrarTarjeta, grabar, descargarPng, ruta.puntos.length]);

    return <GrabacionDronContext.Provider value={value}>{children}</GrabacionDronContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGrabacionDron = () => useContext(GrabacionDronContext) || INACTIVA;
