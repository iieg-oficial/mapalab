import { useCallback, useEffect, useRef, useState } from 'react';
import { calcularMedicion } from '@pages/maps/helpers/resultadoMedicion';
import {
    FUENTE_MEDICION_3D as FUENTE, anotacionDeMedicion, capasMedicion3d as capas, geometriaMedicion,
} from '@pages/maps/helpers/medicion3dCapas';

export const useMedicion3d = (map, { onTerminar } = {}) => {
    const [modo, setModoState] = useState(null);
    const [vertices, setVertices] = useState([]);
    const [puntero, setPuntero] = useState(null);
    const [resultado, setResultado] = useState(null);
    const [calculando, setCalculando] = useState(false);
    const [marcador, setMarcador] = useState(null);
    const [terminado, setTerminado] = useState(false);
    const terminadoRef = useRef(false);
    const turnoRef = useRef(0);
    const verticesRef = useRef([]);
    verticesRef.current = vertices;
    const onTerminarRef = useRef(onTerminar);
    onTerminarRef.current = onTerminar;

    const reiniciar = useCallback((lista = []) => {
        terminadoRef.current = false;
        setTerminado(false);
        setVertices(lista);
    }, []);
    const setModo = useCallback((siguiente) => {
        setModoState(siguiente);
        setPuntero(null);
        reiniciar();
    }, [reiniciar]);
    const deshacer = useCallback(() => reiniciar(verticesRef.current.slice(0, -1)), [reiniciar]);
    const borrar = useCallback(() => { setPuntero(null); reiniciar(); }, [reiniciar]);
    const terminar = useCallback((lista = verticesRef.current) => {
        if (terminadoRef.current) return;
        terminadoRef.current = true;
        setTerminado(true);
        setPuntero(null);
        setVertices(lista);
        const anotacion = anotacionDeMedicion(modo, lista);
        if (anotacion) onTerminarRef.current?.(anotacion);
    }, [modo]);

    useEffect(() => {
        if (!map) return undefined;
        if (!map.getSource(FUENTE)) {
            map.addSource(FUENTE, { type: 'geojson', data: geometriaMedicion({ modo: 'linea', vertices: [], marcador: null }) });
            capas.forEach(capa => map.addLayer(capa));
        }
        return () => {
            capas.forEach(capa => { if (map.getLayer(capa.id)) map.removeLayer(capa.id); });
            if (map.getSource(FUENTE)) map.removeSource(FUENTE);
        };
    }, [map]);

    useEffect(() => {
        if (!map || !modo) return undefined;
        map.doubleClickZoom.disable();
        map.getCanvas().style.cursor = 'crosshair';
        let cuadro = null;

        const alClic = (event) => {
            const punto = event.lngLat.toArray();
            if (modo === 'punto') {
                reiniciar([punto]);
                terminar([punto]);
                return;
            }
            if (terminadoRef.current) {
                reiniciar([punto]);
                return;
            }
            setVertices(prev => [...prev, punto]);
        };
        const alMover = (event) => {
            if (terminadoRef.current || modo === 'punto' || !verticesRef.current.length) return;
            const punto = event.lngLat.toArray();
            cancelAnimationFrame(cuadro);
            cuadro = requestAnimationFrame(() => setPuntero(punto));
        };
        const alDobleClic = () => terminar(verticesRef.current.slice(0, -1));
        const alTeclear = (event) => { if (event.key === 'Enter' || event.key === 'Escape') terminar(); };

        map.on('click', alClic);
        map.on('mousemove', alMover);
        map.on('dblclick', alDobleClic);
        window.addEventListener('keydown', alTeclear);
        return () => {
            cancelAnimationFrame(cuadro);
            map.off('click', alClic);
            map.off('mousemove', alMover);
            map.off('dblclick', alDobleClic);
            window.removeEventListener('keydown', alTeclear);
            map.doubleClickZoom.enable();
            map.getCanvas().style.cursor = '';
        };
    }, [map, modo, terminar, reiniciar]);

    useEffect(() => {
        const fuente = map?.getSource(FUENTE);
        if (fuente) fuente.setData(geometriaMedicion({ modo, vertices, marcador, puntero }));
    }, [map, modo, vertices, marcador, puntero]);

    useEffect(() => {
        const turno = ++turnoRef.current;
        setMarcador(null);
        setCalculando(true);
        calcularMedicion(modo, vertices)
            .then((valor) => { if (turno === turnoRef.current) setResultado(valor); })
            .catch(() => { if (turno === turnoRef.current) setResultado(null); })
            .finally(() => { if (turno === turnoRef.current) setCalculando(false); });
    }, [modo, vertices]);

    return { modo, setModo, vertices, terminado, resultado, calculando, deshacer, borrar, terminar: () => terminar(), setMarcador };
};
