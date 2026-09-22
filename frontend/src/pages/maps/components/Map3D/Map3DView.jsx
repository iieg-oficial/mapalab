import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { useWMSLegend } from '@hooksMaps/useWMSLegend';
import { useMap3dLayers } from '@hooksMaps/useMap3dLayers';
import { useMap3dVectors } from '@hooksMaps/useMap3dVectors';
import { useMap3dExtrusions } from '@hooksMaps/useMap3dExtrusions';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import {
    CIELO_SPEC, VIEW3D_PITCH_MAX, basemapLayers, basemapSources, buildBaseStyle, cameraToOlView,
    olViewToCamera, RELIEF_LAYER_ID,
} from '@pages/maps/helpers/view3d';
import { useMap3dPopup } from '@hooksMaps/useMap3dPopup';
import { useMap3dContorno } from '@hooksMaps/useMap3dContorno';

const TERRAIN_SOURCE = 'terreno';
const ORBITA_GRADOS_POR_SEGUNDO = 8;

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

const Map3DView = () => {
    const containerRef = useRef(null);
    const { mapRef, baseMapId, basemaps, allLayers, getServiceMode } = useMapsContext();
    const {
        pitch, bearing, exaggeration, extruded, map3dRef, setPitch, setBearing, exit, reportExtrusion,
        sol, alturaColumnas, orbita,
    } = useView3d();
    const { getLegendJson } = useWMSLegend();
    const [map, setMap] = useState(null);
    const orbitaRef = useRef(false);
    orbitaRef.current = orbita;
    const initialRef = useRef({ pitch, bearing, exaggeration, basemap: basemaps[baseMapId] });

    useEffect(() => {
        let disposed = false;
        let instance = null;
        const olMap = mapRef.current;

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
            map3dRef.current = instance;
            instance.on('load', () => {
                instance.setTerrain({ source: TERRAIN_SOURCE, exaggeration: initial.exaggeration });
                instance.setSky(CIELO_SPEC);
                setMap(instance);
            });
            instance.on('pitchend', () => setPitch(instance.getPitch()));
            instance.on('rotateend', () => setBearing(instance.getBearing()));
            instance.on('moveend', () => { if (!orbitaRef.current) writeBackToOl(instance, olMap); });
        }).catch((error) => {
            console.error('[mapa3d] no se pudo cargar MapLibre', error);
            exit();
        });

        return () => {
            disposed = true;
            if (!instance) return;
            writeBackToOl(instance, olMap);
            instance.remove();
            map3dRef.current = null;
        };
    }, [mapRef, map3dRef, setPitch, setBearing, exit]);

    useEffect(() => {
        if (map) map.setTerrain({ source: TERRAIN_SOURCE, exaggeration });
    }, [map, exaggeration]);

    useEffect(() => {
        if (!map?.getLayer(RELIEF_LAYER_ID)) return;
        map.setPaintProperty(RELIEF_LAYER_ID, 'hillshade-illumination-direction', sol);
    }, [map, sol]);

    useEffect(() => {
        if (!map || !orbita) return undefined;
        let frame = null;
        let previo = performance.now();
        const girar = (ahora) => {
            map.setBearing(map.getBearing() + ((ahora - previo) / 1000) * ORBITA_GRADOS_POR_SEGUNDO);
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
    }, [map, orbita, setBearing]);

    useEffect(() => {
        if (!map || orbita) return;
        const pitchDrift = Math.abs(map.getPitch() - pitch) > 0.5;
        const bearingDrift = Math.abs(map.getBearing() - bearing) > 0.5;
        if (pitchDrift || bearingDrift) map.easeTo({ pitch, bearing, duration: 300 });
    }, [map, pitch, bearing, orbita]);

    useEffect(() => {
        if (map) applyBasemap(map, basemaps[baseMapId]);
    }, [map, basemaps, baseMapId]);

    useMap3dContorno(map);
    useMap3dLayers(map, mapRef);
    useMap3dVectors(map, mapRef, extruded, alturaColumnas);
    useMap3dExtrusions(map, mapRef, {
        extrudedIds: extruded, allLayers, getServiceMode, getLegendJson, reportExtrusion, alturaColumnas,
    });
    useMap3dPopup(map);

    if (!mapRef.current) return null;

    return createPortal(
        <div className="absolute inset-0 z-[1] bg-white" role="region" aria-label="Mapa en 3D">
            <div ref={containerRef} className="h-full w-full" />
        </div>,
        mapRef.current.getTargetElement(),
    );
};

export default Map3DView;
