import { useEffect } from 'react';
import { fijarCapaResaltada, soltarCapaResaltada } from '@pages/maps/helpers/layers/capaResaltada';

export const useHoverResaltado = (layerId, habilitado, setHover) => {
    useEffect(() => () => soltarCapaResaltada(layerId), [layerId]);
    return {
        entrar: () => {
            setHover(true);
            if (habilitado) fijarCapaResaltada(layerId);
        },
        salir: () => {
            setHover(false);
            soltarCapaResaltada(layerId);
        },
    };
};
