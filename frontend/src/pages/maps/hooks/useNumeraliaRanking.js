import { useEffect, useMemo, useRef, useState } from 'react';
import { getLayerRanking } from '@services/layerRankingService';

const OPS_PROPORCIONALES = new Set(['count', 'count_where', 'count_distinct', 'sum']);

export const admiteProporcion = (ranking, indice) => (
    indice > 0
    && OPS_PROPORCIONALES.has(ranking?.slots?.[indice]?.op)
    && OPS_PROPORCIONALES.has(ranking?.slots?.[0]?.op)
);

export const ordenarRanking = (ranking, indice, comoPorcentaje) => {
    if (!ranking?.municipios?.length) return [];
    const proporcional = comoPorcentaje && admiteProporcion(ranking, indice);

    return ranking.municipios
        .map(municipio => {
            const bruto = municipio.valores[indice];
            const base = municipio.valores[0];
            const porcentaje = proporcional && base ? (bruto / base) * 100 : null;
            return {
                llave: municipio.llave,
                bruto,
                porcentaje,
                orden: proporcional ? porcentaje : bruto,
            };
        })
        .filter(fila => fila.orden !== null && Number.isFinite(fila.orden))
        .sort((a, b) => b.orden - a.orden)
        .map((fila, indiceOrden) => ({ ...fila, posicion: indiceOrden + 1 }));
};

export const useNumeraliaRanking = (layerId, activo) => {
    const [ranking, setRanking] = useState(null);
    const [cargando, setCargando] = useState(false);
    const pedidoRef = useRef(0);

    useEffect(() => {
        if (!layerId || !activo) {
            setRanking(null);
            setCargando(false);
            return undefined;
        }

        const pedido = pedidoRef.current + 1;
        pedidoRef.current = pedido;
        let cancelado = false;
        setCargando(true);

        getLayerRanking(layerId)
            .then(data => {
                if (cancelado || pedidoRef.current !== pedido) return;
                setRanking(data);
                setCargando(false);
            })
            .catch(() => {
                if (cancelado || pedidoRef.current !== pedido) return;
                setRanking(null);
                setCargando(false);
            });

        return () => { cancelado = true; };
    }, [layerId, activo]);

    return useMemo(() => ({ ranking, cargando }), [ranking, cargando]);
};
