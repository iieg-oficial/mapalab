import { useEffect, useMemo, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { buildMetadataContextKey, getLayerMetadata } from '@services/layerMetadataService';
import { candidatasDelOtroLado, conFechas } from '@pages/maps/helpers/numeraliaLados';

const MAX_CANDIDATAS = 4;
const conEstadisticas = (metadata) => (metadata?.numeralia || []).some(s => s.nombre && s.valor);

export const useCapaOtroLado = (layerId, lado, ambos, base) => {
    const { compareMode } = useMapsContext();
    const [capa, setCapa] = useState(null);
    const otro = lado === 'A' ? 'B' : 'A';
    const candidatas = ambos ? [] : candidatasDelOtroLado(compareMode, lado, layerId).slice(0, MAX_CANDIDATAS);
    const fechas = candidatas.map(id => compareMode?.[`pane${otro}`]?.filters?.[id]?.date || '');
    const firma = `${candidatas.join(',')}|${fechas.join('|')}|${buildMetadataContextKey(base)}`;

    useEffect(() => {
        if (!candidatas.length) {
            setCapa(null);
            return undefined;
        }
        let cancelado = false;
        const buscar = async () => {
            for (let i = 0; i < candidatas.length; i++) {
                const contexto = conFechas(base, fechas[i] || null);
                const metadata = await getLayerMetadata(candidatas[i], contexto).catch(() => null);
                if (cancelado) return;
                if (conEstadisticas(metadata)) {
                    setCapa({ id: candidatas[i], lado: otro, metadata, contexto });
                    return;
                }
            }
            if (!cancelado) setCapa(null);
        };
        buscar();
        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firma]);

    return useMemo(() => (candidatas.length ? capa : null), [candidatas.length, capa]);
};
