import { useEffect, useRef, useState } from 'react';
import { toLonLat } from 'ol/proj';
import { getUid } from 'ol/util';
import { calcularMedicion } from '@pages/maps/helpers/resultadoMedicion';

const MODOS = { LineString: 'linea', Polygon: 'poligono', Point: 'punto' };

export const verticesDeGeometria = (geometria) => {
    const tipo = geometria?.getType?.();
    if (tipo === 'Point') return [toLonLat(geometria.getCoordinates())];
    if (tipo === 'LineString') return geometria.getCoordinates().map(c => toLonLat(c));
    if (tipo === 'Polygon') return (geometria.getCoordinates()[0] || []).slice(0, -1).map(c => toLonLat(c));
    return [];
};

export const verticesDeMedicion = (medicion) => verticesDeGeometria(medicion?.feature?.getGeometry?.());

export const ultimaMedicion = (measurements, tipos = ['LineString', 'Polygon']) => (
    [...measurements].reverse().find(m => tipos.includes(m.type) && m.visible !== false) || null
);

export const useResultadoMedicion = (geometria) => {
    const modo = MODOS[geometria?.getType?.()] || null;
    const clave = modo ? `${getUid(geometria)}:${geometria.getRevision()}` : null;
    const geometriaRef = useRef(geometria);
    geometriaRef.current = geometria;
    const [estado, setEstado] = useState({ clave: null, resultado: null, calculando: false });
    const [cerradoClave, setCerradoClave] = useState(null);

    useEffect(() => {
        if (!clave) return undefined;
        const actual = geometriaRef.current;
        let vigente = true;
        setEstado({ clave, resultado: null, calculando: true });
        calcularMedicion(MODOS[actual.getType()], verticesDeGeometria(actual))
            .then((resultado) => { if (vigente) setEstado({ clave, resultado, calculando: false }); })
            .catch(() => { if (vigente) setEstado({ clave, resultado: null, calculando: false }); });
        return () => { vigente = false; };
    }, [clave]);

    return {
        visible: !!clave && cerradoClave !== clave && estado.clave === clave,
        modo,
        resultado: estado.resultado,
        calculando: estado.calculando,
        cerrar: () => setCerradoClave(clave),
    };
};
