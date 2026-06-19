import { useEffect } from 'react';
import { RELIEF_OVERLAY } from '@pages/maps/helpers/basemaps';

export const useReliefOverlay = (reliefOverlayRef, baseMapId, isInegiMode) => {
    useEffect(() => {
        const layer = reliefOverlayRef?.current;
        if (!layer) return;

        layer.setVisible(baseMapId !== 'sin_mapalab');

        const desiredVariant = isInegiMode ? 'inegi' : 'iieg';
        if (layer.get('reliefVariant') !== desiredVariant) {
            layer.setSource(RELIEF_OVERLAY[desiredVariant]());
            layer.set('reliefVariant', desiredVariant);
        }
    }, [reliefOverlayRef, baseMapId, isInegiMode]);
};
