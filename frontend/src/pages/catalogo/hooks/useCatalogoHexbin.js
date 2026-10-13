import { useEffect, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { montarHexbin, vistaPara } from '@pages/maps/helpers/hexbinEntrada';
import { VECTOR_FEATURE_LIMIT } from '@pages/maps/helpers/serviceMode';
import { countVectorFeatures, fetchVectorFeatures, VECTOR_PROJECTION } from '@services/vectorLayerService';
import { idTablaCatalogo } from './useCatalogoTabla';
import { normalizarOpciones } from '@pages/maps/helpers/hexbinOpciones';

const HEXBIN_Z = 6;
const HEXBIN_OPACIDAD = 0.85;

export const hexbinDisponible = (capa, tiempo) => !!capa && !tiempo?.isRaster && tiempo?.geometria === 'point';

export const fuenteHexbin = (capa, filtro, campo = null) => (capa?.hexbinLayerKey && !filtro && !campo ? 'precalculado' : 'navegador');

export const useCatalogoHexbin = ({ mapRef, wmsLayerRef, capa, tiempo, activo, opciones = null, onCambio }) => {
    const onCambioRef = useRef(onCambio);
    onCambioRef.current = onCambio;
    const filtro = tiempo?.filtroMapa || null;
    const disponible = hexbinDisponible(capa, tiempo);
    const limpias = normalizarOpciones(opciones);
    const opcionesRef = useRef(limpias);
    opcionesRef.current = limpias;
    const montajeRef = useRef(null);
    const { campo, reductor, metodo } = limpias;

    useEffect(() => {
        const map = mapRef.current;
        const wms = wmsLayerRef.current;
        const avisar = (estado) => onCambioRef.current?.(estado);
        if (!activo || !disponible || !map || !wms) {
            avisar(null);
            return undefined;
        }

        const controller = new AbortController();
        let montaje = null;
        wms.setVisible(false);

        const enNavegador = async () => {
            const cfg = hydrateWmsConfig({ geoserverWorkspace: capa.geoserverWorkspace, geoserverLayer: capa.geoserverLayer });
            const total = await countVectorFeatures(cfg, filtro, controller.signal);
            if (controller.signal.aborted) return;
            if (total !== null && total > VECTOR_FEATURE_LIMIT) {
                const vista = await vistaPara(cfg, filtro, controller.signal);
                if (controller.signal.aborted) return;
                if (vista) montar(false, vista);
                else avisar({ estado: 'demasiados', total, limite: VECTOR_FEATURE_LIMIT });
                return;
            }
            const data = await fetchVectorFeatures(cfg, filtro, controller.signal);
            if (controller.signal.aborted) return;
            const features = new GeoJSON().readFeatures(data || { type: 'FeatureCollection', features: [] }, {
                dataProjection: VECTOR_PROJECTION,
                featureProjection: VECTOR_PROJECTION,
            });
            montaje.vectorSource.addFeatures(features);
            if (features.length === 0) montaje.avisarEstadisticas();
        };

        const navegador = () => {
            enNavegador().catch(() => {
                if (!controller.signal.aborted) avisar({ estado: 'error' });
            });
        };

        const montar = (precalculado, vista = null) => {
            montaje?.desmontar();
            montaje = montarHexbin({
                map,
                precalculado,
                vista,
                opciones: opcionesRef.current,
                memberIds: [idTablaCatalogo(capa)],
                claves: [capa.hexbinLayerKey],
                zIndex: HEXBIN_Z,
                opacity: HEXBIN_OPACIDAD,
                onStats: stats => avisar({ estado: 'listo', fuente: precalculado ? 'precalculado' : vista ? 'vista' : 'navegador', stats }),
                onAcercate: aviso => avisar({ estado: 'acercate', ...aviso }),
                onSinPrecalculado: () => {
                    if (controller.signal.aborted) return;
                    montar(false);
                    navegador();
                },
            });
            montajeRef.current = montaje;
        };

        avisar({ estado: 'cargando' });
        const precalculado = fuenteHexbin(capa, filtro, opcionesRef.current.campo) === 'precalculado';
        montar(precalculado);
        if (!precalculado) navegador();

        return () => {
            controller.abort();
            montaje?.desmontar();
            montajeRef.current = null;
            wms.setVisible(true);
        };
    }, [activo, disponible, capa, filtro, campo, mapRef, wmsLayerRef]);

    useEffect(() => {
        montajeRef.current?.aplicarOpciones(opcionesRef.current);
    }, [reductor, metodo]);

    return disponible;
};
