import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { useWMSLegend } from '@hooksMaps/useWMSLegend';
import { useMap3dLayers } from '@hooksMaps/useMap3dLayers';
import { useMap3dVectors } from '@hooksMaps/useMap3dVectors';
import { useMap3dExtrusions } from '@hooksMaps/useMap3dExtrusions';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import {
    cieloSpec, VIEW3D_PITCH_MAX, basemapLayers, basemapSources, buildBaseStyle, cameraToOlView,
    olViewToCamera, RELIEF_LAYER_ID,
} from '@pages/maps/helpers/view3d';
import { useMap3dContorno } from '@hooksMaps/useMap3dContorno';
import { useMap3dBillboards } from '@hooksMaps/useMap3dBillboards';
import { useMedicionesGuardadas3d } from '@hooksMaps/useMedicionesGuardadas3d';
import { useAnotacionesPuntuales3d } from '@hooksMaps/useAnotacionesPuntuales3d';
import { useCamara3dSincronizada } from '@hooksMaps/useCamara3dSincronizada';
import { useMap3dMunicipio } from '@hooksMaps/useMap3dMunicipio';
import { useMap3dEtiquetas } from '@hooksMaps/useMap3dEtiquetas';
import { useDronVuelo } from '@hooksMaps/useDronVuelo';
import { useDron } from '@contexts/DronContext';
import Medicion3D from './Medicion3D';
import { Clic3dPropio, Clic3dVisor } from './Clic3d';

const TERRAIN_SOURCE = 'terreno';

const applyBasemap = (map, basemap) => {
    ['etiquetas', 'base'].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
    });
    Object.entries(basemapSources(basemap)).forEach(([id, spec]) => map.addSource(id, spec));
    basemapLayers(basemap).forEach((layer) => {
        map.addLayer(layer, layer.id === 'base' ? RELIEF_LAYER_ID : undefined);
    });
};

const writeBackToOl = (map, olMap) => {
    const view = olMap?.getView();
    if (!view) return;
    const { center, zoom } = cameraToOlView({ center: map.getCenter().toArray(), zoom: map.getZoom() });
    view.setCenter(center);
    view.setZoom(zoom);
    view.setRotation(0);
};

const Map3DView = ({ consultar = null, mediciones = true, olMapRef = null, principal = true, mapasExtra = undefined, onMapa = null, onMidiendo = null, pausado = false }) => {
    const containerRef = useRef(null);
    const { mapRef, baseMapId, basemaps, allLayers, getServiceMode, areMeasurementToolsVisible, areAnnotationToolsVisible, measurements, municipioMode } = useMapsContext();
    const {
        pitch, bearing, exaggeration, extruded, map3dRef, grupo3dRef, setPitch, setBearing, exit, reportExtrusion,
        sol, alturaColumnas, orbita, terreno, cielo, niebla, estiloPuntos, escalaSimbolos, agruparPuntos, contorno, velocidadOrbita, estiloTextos,
    } = useView3d();
    const olRef = olMapRef || mapRef;
    const { activo: enDron } = useDron();
    const dronRef = useRef(false);
    dronRef.current = enDron && principal;
    const { getLegendJson } = useWMSLegend();
    const [map, setMap] = useState(null);
    const [midiendo, setMidiendo] = useState(false);
    useEffect(() => {
        onMapa?.(map);
        return () => onMapa?.(null);
    }, [map, onMapa]);
    useEffect(() => { onMidiendo?.(midiendo); }, [midiendo, onMidiendo]);
    const [dePie, setDePie] = useState(() => new Map());
    const alListarDePie = useCallback((ids) => {
        setDePie(previo => (previo.size === ids.size && [...ids].every(([id, desde]) => previo.get(id) === desde) ? previo : ids));
    }, []);
    const orbitaRef = useRef(false);
    orbitaRef.current = orbita;
    const velocidadRef = useRef(velocidadOrbita);
    velocidadRef.current = velocidadOrbita;
    const initialRef = useRef({ pitch, bearing, exaggeration, basemap: basemaps[baseMapId] });

    useEffect(() => {
        let disposed = false;
        let instance = null;
        const olMap = olRef.current;

        loadMaplibre().then((maplibregl) => {
            if (disposed || !containerRef.current) return;
            const { center, zoom } = olViewToCamera(olMap?.getView());
            const initial = initialRef.current;
            instance = new maplibregl.Map({
                container: containerRef.current,
                style: buildBaseStyle(initial.basemap),
                center,
                zoom,
                pitch: initial.pitch,
                bearing: initial.bearing,
                maxPitch: VIEW3D_PITCH_MAX,
                attributionControl: false,
                canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true },
            });
            if (principal) map3dRef.current = instance;
            instance.on('load', () => {
                setMap(instance);
            });
            instance.on('pitchend', () => { if (!dronRef.current) setPitch(instance.getPitch()); });
            instance.on('rotateend', () => { if (!dronRef.current) setBearing(instance.getBearing()); });
            instance.on('moveend', () => { if (!orbitaRef.current && !dronRef.current) writeBackToOl(instance, olMap); });
        }).catch((error) => {
            console.error('[mapa3d] no se pudo cargar MapLibre', error);
            exit();
        });

        return () => {
            disposed = true;
            if (!instance) return;
            writeBackToOl(instance, olMap);
            instance.remove();
            if (principal) map3dRef.current = null;
        };
    }, [olRef, principal, map3dRef, setPitch, setBearing, exit]);

    useEffect(() => {
        const destino = olMapRef?.current?.getTargetElement();
        if (!destino) return undefined;
        const previo = destino.style.isolation;
        destino.style.isolation = 'isolate';
        return () => { destino.style.isolation = previo; };
    }, [olMapRef]);

    useEffect(() => {
        if (map) map.setTerrain(terreno ? { source: TERRAIN_SOURCE, exaggeration } : null);
    }, [map, exaggeration, terreno]);

    useEffect(() => {
        if (map) map.setSky(cieloSpec({ cielo, niebla }));
    }, [map, cielo, niebla]);

    useEffect(() => {
        if (!map?.getLayer(RELIEF_LAYER_ID)) return;
        map.setPaintProperty(RELIEF_LAYER_ID, 'hillshade-illumination-direction', sol);
    }, [map, sol]);

    useEffect(() => {
        if (!map || !orbita || !principal) return undefined;
        let frame = null;
        const velocidad = () => velocidadRef.current;
        let previo = performance.now();
        const girar = (ahora) => {
            map.setBearing(map.getBearing() + ((ahora - previo) / 1000) * velocidad());
            previo = ahora;
            frame = requestAnimationFrame(girar);
        };
        frame = requestAnimationFrame(girar);
        const reloj = setInterval(() => setBearing(map.getBearing()), 200);
        return () => {
            cancelAnimationFrame(frame);
            clearInterval(reloj);
            setBearing(map.getBearing());
        };
    }, [map, orbita, principal, setBearing]);

    useEffect(() => {
        if (!map || orbita || !principal || enDron) return;
        const pitchDrift = Math.abs(map.getPitch() - pitch) > 0.5;
        const bearingDrift = Math.abs(map.getBearing() - bearing) > 0.5;
        if (pitchDrift || bearingDrift) map.easeTo({ pitch, bearing, duration: 300 });
    }, [map, pitch, bearing, orbita, principal, enDron]);

    useEffect(() => {
        if (map) applyBasemap(map, basemaps[baseMapId]);
    }, [map, basemaps, baseMapId]);

    useMap3dContorno(map, contorno);
    useDronVuelo(map, principal);
    useCamara3dSincronizada(map, grupo3dRef);
    const sinTexto = useMap3dEtiquetas(map, olRef, { activo: estiloTextos === 'frente', escala: escalaSimbolos, dePie });
    useMap3dLayers(map, olRef, dePie, sinTexto);
    useMap3dBillboards(map, olRef, {
        allLayers, getServiceMode, getLegendJson, onReady: alListarDePie, estilo: estiloPuntos, escala: escalaSimbolos, agrupar: agruparPuntos,
    });
    useMap3dVectors(map, olRef, extruded, alturaColumnas);
    useMap3dExtrusions(map, olRef, {
        extrudedIds: extruded, allLayers, getServiceMode, getLegendJson, reportExtrusion, alturaColumnas,
    });
    useMedicionesGuardadas3d(map, measurements);
    useMap3dMunicipio(map, municipioMode, principal);
    useAnotacionesPuntuales3d(map, measurements, estiloPuntos, escalaSimbolos);

    if (!olRef.current) return null;

    return (
        <>
            {createPortal(
                <div className="absolute inset-0 z-[1] bg-white" role="region" aria-label="Mapa en 3D">
                    <div ref={containerRef} className="h-full w-full" />
                </div>,
                olRef.current.getTargetElement(),
            )}
            {map && mediciones && principal && (areMeasurementToolsVisible || areAnnotationToolsVisible || measurements?.length > 0) && <Medicion3D map={map} mapasExtra={mapasExtra} mapa2dRef={olRef} onMidiendo={setMidiendo} />}
            {consultar
                ? <Clic3dPropio map={map} mapRef={olRef} pausado={midiendo || pausado} consultar={consultar} />
                : <Clic3dVisor map={map} mapRef={olRef} pausado={midiendo || pausado} />}
        </>
    );
};

export default Map3DView;
