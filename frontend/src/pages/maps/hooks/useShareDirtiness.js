import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { toLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { vistaCambio } from '@pages/maps/helpers/shareViewDrift';
import { shareAplicadoHace } from '@pages/maps/helpers/shareAplicacion';

const GRACE_MS = 500;
const ENGANCHE_MS = 100;
const ENGANCHE_INTENTOS = 50;

const leerVista = (map) => {
    const vista = map?.getView?.();
    const centro = vista?.getCenter?.();
    if (!centro) return null;
    const [lon, lat] = toLonLat(centro);
    return { lon, lat, zoom: vista.getZoom() };
};

export const useShareDirtiness = () => {
    const { mapRef, activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId } = useMapsContext();
    const [searchParams] = useSearchParams();
    const loadedShareId = searchParams.get('s');

    const [isDirty, setIsDirty] = useState(false);
    const graceUntilRef = useRef(0);
    const lastShareIdRef = useRef(null);
    const pendingResetRef = useRef(false);
    const baseVistaRef = useRef(null);

    if (lastShareIdRef.current !== loadedShareId) {
        lastShareIdRef.current = loadedShareId;
        pendingResetRef.current = true;
        baseVistaRef.current = null;
        if (isDirty) setIsDirty(false);
    }

    const enGracia = useCallback(
        () => Date.now() < graceUntilRef.current || shareAplicadoHace() < GRACE_MS,
        [],
    );

    useEffect(() => {
        if (pendingResetRef.current) {
            pendingResetRef.current = false;
            graceUntilRef.current = Date.now() + GRACE_MS;
        }
    }, [loadedShareId]);

    useEffect(() => {
        if (!loadedShareId) return;
        if (!Array.isArray(activeLayerIds) || activeLayerIds.length === 0) return;
        if (enGracia()) return;
        if (!isDirty) setIsDirty(true);
    }, [activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId, loadedShareId, isDirty, enGracia]);

    useEffect(() => {
        if (!loadedShareId) return undefined;
        let map = null;
        let intentos = 0;
        let temporizador = null;

        const alMover = () => {
            const vista = leerVista(map);
            if (!vista) return;
            if (!baseVistaRef.current || enGracia()) {
                baseVistaRef.current = vista;
                return;
            }
            if (vistaCambio(baseVistaRef.current, vista)) setIsDirty(true);
        };

        const enganchar = () => {
            map = mapRef?.current || null;
            if (map) {
                if (!baseVistaRef.current) baseVistaRef.current = leerVista(map);
                map.on('moveend', alMover);
                return;
            }
            intentos += 1;
            if (intentos < ENGANCHE_INTENTOS) temporizador = setTimeout(enganchar, ENGANCHE_MS);
        };

        enganchar();
        return () => {
            clearTimeout(temporizador);
            if (map) map.un('moveend', alMover);
        };
    }, [mapRef, loadedShareId, enGracia]);

    const reset = useCallback(() => {
        setIsDirty(false);
        graceUntilRef.current = Date.now() + GRACE_MS;
        baseVistaRef.current = leerVista(mapRef?.current);
    }, [mapRef]);

    const markPending = useCallback(() => {
        graceUntilRef.current = 0;
        setIsDirty(false);
    }, []);

    return {
        loadedShareId,
        isDirty: isDirty && !!loadedShareId,
        reset,
        markPending,
    };
};
