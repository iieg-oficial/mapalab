import { useEffect, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { montarHexbin } from '@pages/maps/helpers/hexbinEntrada';
import { VECTOR_FEATURE_LIMIT } from '@pages/maps/helpers/serviceMode';
import { countVectorFeatures, fetchVectorFeatures, VECTOR_PROJECTION } from '@services/vectorLayerService';
import { idTablaCatalogo } from './useCatalogoTabla';

const HEXBIN_Z = 6;
const HEXBIN_OPACIDAD = 0.85;

export const hexbinDisponible = (capa, tiempo) => !!capa && !tiempo?.isRaster && tiempo?.geometria === 'point';

export const fuenteHexbin = (capa, filtro) => (capa?.hexbinLayerKey && !filtro ? 'precalculado' : 'navegador');

export const useCatalogoHexbin = ({ mapRef, wmsLayerRef, capa, tiempo, activo, onCambio }) => {
    const onCambioRef = useRef(onCambio);
    onCambioRef.current = onCambio;
    const filtro = tiempo?.filtroMapa || null;
    const disponible = hexbinDisponible(capa, tiempo);

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
                avisar({ estado: 'demasiados', total, limite: VECTOR_FEATURE_LIMIT });
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

        const montar = (precalculado) => {
            montaje?.desmontar();
            montaje = montarHexbin({
                map,
                precalculado,
                memberIds: [idTablaCatalogo(capa)],
                claves: [capa.hexbinLayerKey],
                zIndex: HEXBIN_Z,
                opacity: HEXBIN_OPACIDAD,
                onStats: stats => avisar({ estado: 'listo', fuente: precalculado ? 'precalculado' : 'navegador', stats }),
                onSinPrecalculado: () => {
                    if (controller.signal.aborted) return;
                    montar(false);
                    navegador();
                },
            });
        };

        avisar({ estado: 'cargando' });
        const precalculado = fuenteHexbin(capa, filtro) === 'precalculado';
        montar(precalculado);
        if (!precalculado) navegador();

        return () => {
            controller.abort();
            montaje?.desmontar();
            wms.setVisible(true);
        };
    }, [activo, disponible, capa, filtro, mapRef, wmsLayerRef]);

    return disponible;
};
