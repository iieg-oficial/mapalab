import { useEffect, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { createHexbinLayer, fillHexbinLayer, fillHexbinLayerFromCells } from '@pages/maps/helpers/hexbinLayer';
import { VECTOR_FEATURE_LIMIT } from '@pages/maps/helpers/serviceMode';
import { resolutionForZoom } from '@constants/hexbin';
import { fetchAggregatedCells, nearestPrecomputed } from '@services/hexbinAggregateService';
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
        const layer = createHexbinLayer({ layerId: idTablaCatalogo(capa), zIndex: HEXBIN_Z, opacity: HEXBIN_OPACIDAD });
        map.addLayer(layer);
        wms.setVisible(false);
        const estado = { modo: null, features: null, resolucion: null };
        const zoom = () => map.getView().getZoom();

        const conPrecalculo = async () => {
            const resolucion = nearestPrecomputed(resolutionForZoom(zoom()));
            if (!resolucion) return false;
            if (resolucion === estado.resolucion) return true;
            const celdas = await fetchAggregatedCells([capa.hexbinLayerKey], resolucion, controller.signal);
            if (controller.signal.aborted) return true;
            if (!celdas?.length) return false;
            estado.modo = 'precalculado';
            estado.resolucion = resolucion;
            avisar({ estado: 'listo', fuente: 'precalculado', stats: fillHexbinLayerFromCells(layer, celdas) });
            return true;
        };

        const reagrupar = () => {
            const resolucion = resolutionForZoom(zoom());
            if (resolucion === estado.resolucion) return;
            estado.resolucion = resolucion;
            avisar({ estado: 'listo', fuente: 'navegador', stats: fillHexbinLayer(layer, estado.features, resolucion) });
        };

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
            estado.modo = 'navegador';
            estado.features = new GeoJSON().readFeatures(data || { type: 'FeatureCollection', features: [] }, {
                dataProjection: VECTOR_PROJECTION,
                featureProjection: VECTOR_PROJECTION,
            });
            reagrupar();
        };

        const alMover = () => {
            if (estado.modo === 'navegador') reagrupar();
            else if (estado.modo === 'precalculado') conPrecalculo().catch(() => {});
        };

        avisar({ estado: 'cargando' });
        (async () => {
            try {
                if (fuenteHexbin(capa, filtro) === 'precalculado' && await conPrecalculo()) return;
                await enNavegador();
            } catch {
                if (!controller.signal.aborted) avisar({ estado: 'error' });
            }
        })();
        map.on('moveend', alMover);

        return () => {
            controller.abort();
            map.un('moveend', alMover);
            map.removeLayer(layer);
            wms.setVisible(true);
        };
    }, [activo, disponible, capa, filtro, mapRef, wmsLayerRef]);

    return disponible;
};
