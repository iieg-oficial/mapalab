import { useMapsContext } from '@hooks/useMaps';
import { useVistaParaMinimapa } from '@pages/maps/hooks/useVistaParaMinimapa';
import { useMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';
import { municipioEn } from '@pages/maps/helpers/minimapa';

export const useMinimapa = (forzado = false) => {
    const { mapRef, paneMapInstances, isDrawing } = useMapsContext();
    const [encendido] = useMinimapaEncendido();
    const { vista, visible, activo, siluetas, map } = useVistaParaMinimapa(mapRef, paneMapInstances, forzado || encendido);
    const municipio = visible ? municipioEn(siluetas?.municipios, vista?.centro) : null;
    return { visible, activo, lienzo: { vista, siluetas, municipio, map, bloqueado: isDrawing } };
};
