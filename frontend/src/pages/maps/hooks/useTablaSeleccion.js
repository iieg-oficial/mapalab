import { useCallback, useMemo, useRef, useState } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { getCenter } from 'ol/extent';
import { toLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { centerOnResults } from '@pages/maps/helpers/featureGeometry';

const formato = new GeoJSON();

const centroDe = (feature) => {
    if (!feature?.geometry) return null;
    try {
        const geometria = formato.readGeometry(feature.geometry, {
            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:3857',
        });
        const centro = getCenter(geometria.getExtent());
        return Array.isArray(centro) && centro.every(Number.isFinite) ? centro : null;
    } catch {
        return null;
    }
};

const rango = (desde, hasta) => {
    const inicio = Math.min(desde, hasta);
    const fin = Math.max(desde, hasta);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
};

export const useTablaSeleccion = (layerId, layerDef, filas) => {
    const { mapRef, setSelectedFeatureInfo, clickPosition } = useMapsContext();
    const [ids, setIds] = useState([]);
    const anclaRef = useRef(null);

    const seleccionadas = useMemo(() => new Set(ids), [ids]);

    const mostrar = useCallback((elegidas) => {
        if (elegidas.length === 0) {
            setSelectedFeatureInfo(null);
            return;
        }

        const nombre = layerDef?.label || layerDef?.name || 'Capa';
        const results = [{
            layerId,
            layerName: nombre,
            features: elegidas,
            cachedFeatures: elegidas,
            totalAvailable: elegidas.length,
            displayCap: elegidas.length,
        }];

        const centro = centroDe(elegidas[0]);
        const mapa = mapRef?.current;
        if (centro && mapa) {
            const pixel = mapa.getPixelFromCoordinate(centro);
            if (pixel) clickPosition?.updatePosition({ pixel });
        }
        const [lng, lat] = centro ? toLonLat(centro) : [null, null];

        setSelectedFeatureInfo({
            lngLat: Number.isFinite(lng) ? { lng, lat } : null,
            results,
            queriedLayerName: nombre,
            queriedLayerId: layerId,
        });

        centerOnResults({ activeMap: mapa, results, clickPosition });
    }, [clickPosition, layerDef, layerId, mapRef, setSelectedFeatureInfo]);

    const aplicar = useCallback((siguientes) => {
        setIds(siguientes);
        const porId = new Map((filas || []).map(fila => [fila?.id, fila]));
        mostrar(siguientes.map(id => porId.get(id)).filter(Boolean));
    }, [filas, mostrar]);

    const seleccionar = useCallback((feature, indice, modo = {}) => {
        const id = feature?.id;
        if (!id) return;

        if (modo.rango && anclaRef.current !== null) {
            const desde = (filas || []).findIndex(fila => fila?.id === anclaRef.current);
            if (desde >= 0) {
                const elegidos = rango(desde, indice)
                    .map(posicion => filas[posicion]?.id)
                    .filter(Boolean);
                aplicar(elegidos);
                return;
            }
        }

        if (modo.alternar) {
            anclaRef.current = id;
            aplicar(seleccionadas.has(id) ? ids.filter(actual => actual !== id) : [...ids, id]);
            return;
        }

        anclaRef.current = id;
        aplicar([id]);
    }, [aplicar, filas, ids, seleccionadas]);

    const limpiar = useCallback(() => {
        anclaRef.current = null;
        setIds([]);
        setSelectedFeatureInfo(null);
    }, [setSelectedFeatureInfo]);

    return { seleccionadas, cuantas: ids.length, seleccionar, limpiar };
};
