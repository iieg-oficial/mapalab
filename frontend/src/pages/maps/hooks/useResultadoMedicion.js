import { useEffect, useRef, useState } from 'react';
import { toLonLat } from 'ol/proj';
import { calcularMedicion } from '@pages/maps/helpers/resultadoMedicion';

const MODOS = { LineString: 'linea', Polygon: 'poligono' };

export const verticesDeMedicion = (medicion) => {
    const geometria = medicion?.feature?.getGeometry?.();
    if (!geometria) return [];
    if (medicion.type === 'LineString') return geometria.getCoordinates().map(c => toLonLat(c));
    const anillo = geometria.getCoordinates()[0] || [];
    return anillo.slice(0, -1).map(c => toLonLat(c));
};

export const ultimaMedicion = (measurements) => [...measurements].reverse().find(m => MODOS[m.type] && m.visible !== false) || null;

export const useResultadoMedicion = (measurements) => {
    const ultima = ultimaMedicion(measurements);
    const id = ultima?.id ?? null;
    const ultimaRef = useRef(ultima);
    ultimaRef.current = ultima;
    const [estado, setEstado] = useState({ id: null, resultado: null, calculando: false });
    const [cerradoId, setCerradoId] = useState(null);

    useEffect(() => {
        const medicion = ultimaRef.current;
        if (!medicion) return undefined;
        let vigente = true;
        setEstado({ id: medicion.id, resultado: null, calculando: true });
        calcularMedicion(MODOS[medicion.type], verticesDeMedicion(medicion))
            .then((resultado) => { if (vigente) setEstado({ id: medicion.id, resultado, calculando: false }); })
            .catch(() => { if (vigente) setEstado({ id: medicion.id, resultado: null, calculando: false }); });
        return () => { vigente = false; };
    }, [id]);

    const visible = !!ultima && cerradoId !== id && estado.id === id;
    return {
        visible,
        modo: ultima ? MODOS[ultima.type] : null,
        resultado: estado.resultado,
        calculando: estado.calculando,
        cerrar: () => setCerradoId(id),
    };
};
