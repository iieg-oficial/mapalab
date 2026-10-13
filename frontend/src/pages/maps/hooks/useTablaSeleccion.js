import { useCallback, useEffect, useMemo, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { getCenter } from 'ol/extent';
import { toLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { centerOnResults } from '@pages/maps/helpers/featureGeometry';
import { LLAVE_SELECCION, cqlDeIds } from '@pages/maps/helpers/tablaCqlBuilder';

const MINIMO_MULTIPLE = 2;
const MAXIMO_EN_TARJETA = 100;

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

export const useTablaSeleccion = (layerId, layerDef, filas, tarjeta, tabla) => {
    const { mapRef, setSelectedFeatureInfo, clickPosition, applyFilter, clearFilter } = useMapsContext();
    const { estadoDe, fijarSeleccion } = useTablaAtributos();
    const ids = estadoDe(layerId).seleccion;
    const anclaRef = useRef(null);
    const pedidoRef = useRef(null);

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
            littleCard: tarjeta || undefined,
            features: elegidas,
            cachedFeatures: elegidas,
            totalAvailable: elegidas.length,
            displayCap: elegidas.length,
        }];

        const centro = centroDe(elegidas[0]);
        const mapa = mapRef?.current;
        const [lng, lat] = centro ? toLonLat(centro) : [null, null];

        clickPosition?.updatePosition({
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2,
        });

        setSelectedFeatureInfo({
            lngLat: Number.isFinite(lng) ? { lng, lat } : null,
            results,
            queriedLayerName: nombre,
            queriedLayerId: layerId,
        });

        centerOnResults({ activeMap: mapa, results });
    }, [clickPosition, layerDef, layerId, mapRef, setSelectedFeatureInfo, tarjeta]);

    const mostrarIds = useCallback((siguientes) => {
        pedidoRef.current?.abort();
        if (siguientes.length === 0 || !tabla) {
            mostrar([]);
            return;
        }
        const controlador = new AbortController();
        pedidoRef.current = controlador;
        const pedidos = siguientes.slice(0, MAXIMO_EN_TARJETA);
        tabla.fetchFeatures({ ids: pedidos, srsName: 'EPSG:3857', signal: controlador.signal })
            .then(coleccion => {
                if (controlador.signal.aborted) return;
                const porId = new Map(coleccion.features.map(feature => [String(feature.id), feature]));
                mostrar(pedidos.map(id => porId.get(String(id))).filter(Boolean));
            })
            .catch(() => {});
    }, [mostrar, tabla]);

    const aplicar = useCallback((siguientes) => {
        fijarSeleccion(layerId, siguientes);
        mostrarIds(siguientes);

        const cql = siguientes.length >= MINIMO_MULTIPLE ? cqlDeIds(siguientes) : null;
        if (cql) applyFilter(layerId, LLAVE_SELECCION, cql);
        else clearFilter(layerId, LLAVE_SELECCION);
    }, [applyFilter, clearFilter, fijarSeleccion, layerId, mostrarIds]);

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
        pedidoRef.current?.abort();
        fijarSeleccion(layerId, []);
        setSelectedFeatureInfo(null);
        clearFilter(layerId, LLAVE_SELECCION);
    }, [clearFilter, fijarSeleccion, layerId, setSelectedFeatureInfo]);

    const todas = useCallback(() => {
        aplicar((filas || []).map(fila => fila?.id).filter(Boolean));
    }, [aplicar, filas]);

    useEffect(() => () => clearFilter(layerId, LLAVE_SELECCION), [clearFilter, layerId]);

    useEffect(() => () => pedidoRef.current?.abort(), []);

    return {
        seleccionadas,
        cuantas: ids.length,
        soloSeleccionados: ids.length >= MINIMO_MULTIPLE,
        seleccionar,
        limpiar,
        todas,
    };
};
