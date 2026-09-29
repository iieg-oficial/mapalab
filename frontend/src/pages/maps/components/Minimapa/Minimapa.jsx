import { useMapsContext } from '@hooks/useMaps';
import { useIsMobile } from '@hooks/useIsMobile';
import { useView3d } from '@contexts/View3dContext';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import Tooltip from '@components/Tooltip';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackMinimapa } from '@services/analyticsService';
import { useVistaParaMinimapa } from '@pages/maps/hooks/useVistaParaMinimapa';
import { useUbicacionMinimapa } from '@pages/maps/hooks/useUbicacionMinimapa';
import { fijarMinimapaEncendido, useMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';
import { TAMANO_MINIMAPA, municipioEn } from '@pages/maps/helpers/minimapa';
import LienzoMinimapa from './LienzoMinimapa';
import MinimapaMovil from './MinimapaMovil';

const OBSTACULOS = ['[data-atribucion]', '[data-panel-numeralia]', '[data-barra-tabla]', '[role="dialog"]', '[role="menu"]'];
const BORDE = 16;
const SEPARACION = 12;

const Minimapa = () => {
    const { mapRef, paneMapInstances, isDrawing } = useMapsContext();
    const { active: en3d } = useView3d();
    const { margenes } = useAreaUtil();
    const isMobile = useIsMobile();
    const [encendido] = useMinimapaEncendido();
    const { vista, visible, siluetas, map } = useVistaParaMinimapa(mapRef, paneMapInstances, encendido && !en3d);
    const ubicacion = useUbicacionMinimapa(visible && !isMobile, OBSTACULOS, { base: BORDE, borde: BORDE + margenes.right, separacion: SEPARACION });
    const municipio = visible ? municipioEn(siluetas?.municipios, vista?.centro) : null;

    if (!visible) return null;

    const lienzo = { vista, siluetas, municipio, map, bloqueado: isDrawing };
    if (isMobile) return <MinimapaMovil {...lienzo} />;

    const mostrar = !!ubicacion;
    const apagar = () => {
        fijarMinimapaEncendido(false);
        trackMinimapa('apagar');
    };

    return (
        <div
            data-minimapa
            aria-hidden={!mostrar}
            className={`fixed z-10 transition-opacity duration-200 ${mostrar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ right: ubicacion?.derecha ?? BORDE, bottom: ubicacion?.abajo ?? BORDE, width: TAMANO_MINIMAPA, height: TAMANO_MINIMAPA }}
        >
            <LienzoMinimapa lado={TAMANO_MINIMAPA} {...lienzo} />
            <div className="absolute right-1.5 top-1.5 flex rounded-full bg-white p-0.5 shadow-md">
                <Tooltip content="Quitar el minimapa. Vuelve desde Herramientas" placement="left" delay={300}>
                    <MobileSheetCloseButton onClick={apagar} />
                </Tooltip>
            </div>
            {municipio && (
                <span className="pointer-events-none absolute bottom-2 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-white px-2.5 py-0.5 font-garet text-[11px]/[16px] font-bold text-purple shadow-md">
                    {municipio.nombre}
                </span>
            )}
        </div>
    );
};

export default Minimapa;
