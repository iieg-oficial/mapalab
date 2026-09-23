import { useCallback, useEffect, useRef, useState } from 'react';
import { alturas } from '@pages/maps/helpers/elevacionDem';
import {
    areaPlana, areaSobreRelieve, densificar, largoPlano, perfilDesde, perimetro, rejillaSobre,
} from '@pages/maps/helpers/medicion3d';

const FUENTE = 'medicion-3d';
const MORADO = '#5C2472';

const capas = [
    { id: `${FUENTE}-relleno`, type: 'fill', source: FUENTE, filter: ['==', ['get', 'rol'], 'area'], paint: { 'fill-color': MORADO, 'fill-opacity': 0.15 } },
    { id: `${FUENTE}-linea`, type: 'line', source: FUENTE, filter: ['==', ['get', 'rol'], 'traza'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': MORADO, 'line-width': 3 } },
    { id: `${FUENTE}-vertices`, type: 'circle', source: FUENTE, filter: ['==', ['get', 'rol'], 'vertice'], paint: { 'circle-radius': 5, 'circle-color': '#FFFFFF', 'circle-stroke-color': MORADO, 'circle-stroke-width': 2, 'circle-pitch-alignment': 'viewport' } },
    { id: `${FUENTE}-marcador`, type: 'circle', source: FUENTE, filter: ['==', ['get', 'rol'], 'marcador'], paint: { 'circle-radius': 6, 'circle-color': '#FF8300', 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2, 'circle-pitch-alignment': 'viewport' } },
];

const figura = (rol, geometry) => ({ type: 'Feature', properties: { rol }, geometry });

export const geometriaMedicion = ({ modo, vertices, marcador }) => {
    const features = vertices.map(v => figura('vertice', { type: 'Point', coordinates: v }));
    if (modo === 'poligono' && vertices.length > 2) {
        const anillo = [...vertices, vertices[0]];
        features.unshift(figura('area', { type: 'Polygon', coordinates: [anillo] }), figura('traza', { type: 'LineString', coordinates: anillo }));
    } else if (modo !== 'punto' && vertices.length > 1) {
        features.unshift(figura('traza', { type: 'LineString', coordinates: vertices }));
    }
    if (marcador) features.push(figura('marcador', { type: 'Point', coordinates: marcador }));
    return { type: 'FeatureCollection', features };
};

const calcular = async (modo, vertices) => {
    if (modo === 'punto') {
        if (!vertices.length) return null;
        const [alt] = await alturas([vertices[0]]);
        return { modo, alt };
    }
    if (modo === 'linea') {
        if (vertices.length < 2) return null;
        const muestras = densificar(vertices);
        const perfil = perfilDesde(muestras, await alturas(muestras.map(m => m.lngLat)));
        return { modo, plano: largoPlano(vertices), ...perfil };
    }
    if (vertices.length < 3) return null;
    const rejilla = rejillaSobre(vertices);
    const superficie = areaSobreRelieve(vertices, rejilla, await alturas(rejilla.nodos));
    return { modo, plano: areaPlana(vertices), superficie, perimetro: perimetro(vertices) };
};

export const useMedicion3d = (map) => {
    const [modo, setModoState] = useState('linea');
    const [vertices, setVertices] = useState([]);
    const [resultado, setResultado] = useState(null);
    const [calculando, setCalculando] = useState(false);
    const [marcador, setMarcador] = useState(null);
    const terminadoRef = useRef(false);
    const turnoRef = useRef(0);

    const setModo = useCallback((siguiente) => {
        setModoState(siguiente);
        setVertices([]);
        terminadoRef.current = false;
    }, []);
    const deshacer = useCallback(() => { terminadoRef.current = false; setVertices(prev => prev.slice(0, -1)); }, []);
    const borrar = useCallback(() => { terminadoRef.current = false; setVertices([]); }, []);

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
        if (!map) return undefined;
        map.doubleClickZoom.disable();
        map.getCanvas().style.cursor = 'crosshair';

        const alClic = (event) => {
            const punto = event.lngLat.toArray();
            if (modo === 'punto') {
                setVertices([punto]);
                return;
            }
            if (terminadoRef.current) {
                terminadoRef.current = false;
                setVertices([punto]);
                return;
            }
            setVertices(prev => [...prev, punto]);
        };
        const terminar = () => { terminadoRef.current = true; };
        const alDobleClic = () => {
            if (modo !== 'punto') setVertices(prev => prev.slice(0, -1));
            terminar();
        };
        const alTeclear = (event) => { if (event.key === 'Escape' || event.key === 'Enter') terminar(); };

        map.on('click', alClic);
        map.on('dblclick', alDobleClic);
        window.addEventListener('keydown', alTeclear);
        return () => {
            map.off('click', alClic);
            map.off('dblclick', alDobleClic);
            window.removeEventListener('keydown', alTeclear);
            map.doubleClickZoom.enable();
            map.getCanvas().style.cursor = '';
        };
    }, [map, modo]);

    useEffect(() => {
        const fuente = map?.getSource(FUENTE);
        if (fuente) fuente.setData(geometriaMedicion({ modo, vertices, marcador }));
    }, [map, modo, vertices, marcador]);

    useEffect(() => {
        const turno = ++turnoRef.current;
        setMarcador(null);
        setCalculando(true);
        calcular(modo, vertices)
            .then((valor) => { if (turno === turnoRef.current) setResultado(valor); })
            .catch(() => { if (turno === turnoRef.current) setResultado(null); })
            .finally(() => { if (turno === turnoRef.current) setCalculando(false); });
    }, [modo, vertices]);

    return { modo, setModo, vertices, resultado, calculando, deshacer, borrar, setMarcador };
};
