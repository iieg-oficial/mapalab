import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { useVistaParaMinimapa } from '@pages/maps/hooks/useVistaParaMinimapa';
import { useMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';
import { municipioEn } from '@pages/maps/helpers/minimapa';

export const useMinimapa = () => {
    const { mapRef, paneMapInstances, isDrawing } = useMapsContext();
    const { active: en3d } = useView3d();
    const [encendido] = useMinimapaEncendido();
    const { vista, visible, activo, siluetas, map } = useVistaParaMinimapa(mapRef, paneMapInstances, encendido && !en3d);
    const municipio = visible ? municipioEn(siluetas?.municipios, vista?.centro) : null;
    return { visible, activo, lienzo: { vista, siluetas, municipio, map, bloqueado: isDrawing } };
};
