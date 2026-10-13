import VectorSource from 'ol/source/Vector';
import { geometriaDe } from '@services/vectorLayerService';
import { hexbinWorker } from './hexbinWorker';
import { mismasOpciones, normalizarOpciones } from './hexbinOpciones';
import { Acercate, crearHexbin, estadisticasHexbin, fuenteLocal, fuentePrecalculada, fuenteVista } from './panalHexbin';

export const montarHexbin = ({
    map,
    precalculado,
    vista = null,
    opciones: opcionesIniciales = null,
    memberIds,
    claves = memberIds,
    zIndex,
    opacity,
    paletteIndex = 0,
    rellenoActivo = true,
    zoomRange = null,
    onStats,
    onLoading,
    onSinPrecalculado,
    onAcercate
}) => {
    let opciones = normalizarOpciones(opcionesIniciales);
    const vectorSource = precalculado || vista ? null : new VectorSource();
    const fuente = vista ? fuenteVista({ ...vista, opciones }) : precalculado ? fuentePrecalculada(claves) : fuenteLocal(vectorSource);
    const hexbin = crearHexbin({
        map,
        source: fuente,
        opciones,
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
        const { status, classification, error } = hexbin.getSnapshot();
        const ahora = status === 'loading';
        if (ahora !== cargando) {
            cargando = ahora;
            onLoading?.(ahora);
        }
        if (status === 'error') {
            if (error instanceof Acercate) {
                layer.setVisible(false);
                clasificacion = null;
                onAcercate?.({ total: error.total, limite: error.limite });
            } else if (precalculado) {
                onSinPrecalculado?.();
            }
            return;
        }
        if (status === 'ready' && !layer.getVisible()) layer.setVisible(true);
        if (status !== 'ready' || !classification || classification === clasificacion) return;
        clasificacion = classification;
        onStats?.(estadisticasHexbin(hexbin, opciones));
    };
    const desuscribir = hexbin.subscribe(alCambiar);
    alCambiar();

    return {
        hexbin,
        layer,
        vectorSource,
        avisarEstadisticas: () => onStats?.(estadisticasHexbin(hexbin, opciones)),
        aplicarOpciones: (siguientes) => {
            const nuevas = normalizarOpciones(siguientes);
            const reagrupar = nuevas.reductor !== opciones.reductor || nuevas.campo !== opciones.campo;
            const reclasificar = nuevas.metodo !== opciones.metodo;
            opciones = nuevas;
            if (reclasificar) hexbin.setClassification({ method: nuevas.metodo });
            if (!reagrupar) return;
            if (fuente.setReducer) fuente.setReducer(nuevas.reductor, nuevas.campo);
            else hexbin.setReducer(nuevas.reductor, nuevas.campo ?? undefined);
        },
        desmontar: () => {
            desuscribir();
            if (cargando) onLoading?.(false);
            hexbin.destroy();
            fuente.release?.();
        }
    };
};

export const vistaPara = async (wmsConfig, cqlFilter, signal) => {
    const worker = hexbinWorker();
    if (!worker) return null;
    const geometria = await geometriaDe(wmsConfig, signal).catch(() => null);
    return geometria ? { worker, wmsConfig, cqlFilter, geometria } : null;
};

export const actualizarEntradaHexbin = (entry, target) => {
    if (!mismasOpciones(entry.opciones, target.opciones)) {
        entry.opciones = target.opciones;
        entry.montaje?.aplicarOpciones(target.opciones);
    }
    if (entry.layer.get('paletteIndex') === target.paletteIndex) return;
    entry.layer.set('paletteIndex', target.paletteIndex);
    entry.layer.changed();
    entry.montaje?.avisarEstadisticas();
};
