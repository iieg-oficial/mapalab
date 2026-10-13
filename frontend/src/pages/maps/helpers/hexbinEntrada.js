import VectorSource from 'ol/source/Vector';
import { crearHexbin, estadisticasHexbin, fuenteLocal, fuentePrecalculada } from './panalHexbin';

export const montarHexbin = ({
    map,
    precalculado,
    memberIds,
    claves = memberIds,
    zIndex,
    opacity,
    paletteIndex = 0,
    rellenoActivo = true,
    zoomRange = null,
    onStats,
    onLoading,
    onSinPrecalculado
}) => {
    const vectorSource = precalculado ? null : new VectorSource();
    const hexbin = crearHexbin({
        map,
        source: precalculado ? fuentePrecalculada(claves) : fuenteLocal(vectorSource),
        layerId: memberIds[0],
        zIndex,
        opacity,
        paletteIndex
    });
    const { layer } = hexbin;
    layer.set('memberIds', memberIds);
    if (rellenoActivo === false) layer.set('rellenoActivo', false);
    if (zoomRange?.min != null) layer.setMinZoom(zoomRange.min);
    if (zoomRange?.max != null) layer.setMaxZoom(zoomRange.max);

    let cargando = false;
    let clasificacion = null;
    const alCambiar = () => {
        const { status, classification } = hexbin.getSnapshot();
        const ahora = status === 'loading';
        if (ahora !== cargando) {
            cargando = ahora;
            onLoading?.(ahora);
        }
        if (status === 'error') {
            if (precalculado) onSinPrecalculado?.();
            return;
        }
        if (status !== 'ready' || !classification || classification === clasificacion) return;
        clasificacion = classification;
        onStats?.(estadisticasHexbin(hexbin));
    };
    const desuscribir = hexbin.subscribe(alCambiar);
    alCambiar();

    return {
        hexbin,
        layer,
        vectorSource,
        avisarEstadisticas: () => onStats?.(estadisticasHexbin(hexbin)),
        desmontar: () => {
            desuscribir();
            if (cargando) onLoading?.(false);
            hexbin.destroy();
        }
    };
};
