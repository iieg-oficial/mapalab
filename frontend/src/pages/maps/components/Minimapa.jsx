import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import Tooltip from '@components/Tooltip';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { trackMinimapa } from '@services/analyticsService';
import { useVistaParaMinimapa } from '@pages/maps/hooks/useVistaParaMinimapa';
import { useUbicacionMinimapa } from '@pages/maps/hooks/useUbicacionMinimapa';
import { fijarMinimapaEncendido, useMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';
import { TAMANO_MINIMAPA, dePixel, municipioEn, vistaDelMinimapa } from '@pages/maps/helpers/minimapa';
import { dibujarMinimapa } from '@pages/maps/helpers/trazoMinimapa';

const OBSTACULOS = ['[data-atribucion]', '[data-panel-numeralia]', '[data-barra-tabla]', '[role="dialog"]', '[role="menu"]'];
const BORDE = 16;
const SEPARACION = 12;
const DURACION_MS = 350;

const Minimapa = () => {
    const { mapRef, paneMapInstances, isDrawing } = useMapsContext();
    const { active: en3d } = useView3d();
    const { margenes } = useAreaUtil();
    const [encendido] = useMinimapaEncendido();
    const { vista, visible, siluetas, map } = useVistaParaMinimapa(mapRef, paneMapInstances, encendido && !en3d);
    const lienzoRef = useRef(null);
    const vistaMiniRef = useRef(null);
    const ubicacion = useUbicacionMinimapa(visible, OBSTACULOS, { base: BORDE, borde: BORDE + margenes.right, separacion: SEPARACION });
    const mostrar = visible && !!ubicacion;
    const extensionEstado = siluetas?.estado?.getExtent() ?? null;
    const municipio = mostrar ? municipioEn(siluetas?.municipios, vista?.centro) : null;

    useEffect(() => {
        if (!mostrar || !vista) return;
        const vistaMini = vistaDelMinimapa({ centro: vista.centro, zoom: vista.zoom, extensionEstado, lado: TAMANO_MINIMAPA });
        vistaMiniRef.current = vistaMini;
        const lienzo = lienzoRef.current;
        const ctx = lienzo?.getContext('2d');
        if (!ctx) return;
        const ratio = window.devicePixelRatio || 1;
        const pixeles = Math.round(TAMANO_MINIMAPA * ratio);
        if (lienzo.width !== pixeles) {
            lienzo.width = pixeles;
            lienzo.height = pixeles;
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        dibujarMinimapa(ctx, { lado: TAMANO_MINIMAPA, vista: vistaMini, estado: siluetas?.estado, municipio, extensionVista: vista.extension });
    }, [mostrar, vista, siluetas, municipio, extensionEstado]);

    if (!visible) return null;

    const irA = (evento) => {
        if (isDrawing || !vistaMiniRef.current) return;
        const caja = evento.currentTarget.getBoundingClientRect();
        const destino = dePixel(vistaMiniRef.current, TAMANO_MINIMAPA, [evento.clientX - caja.left, evento.clientY - caja.top]);
        map?.getView()?.animate({ center: destino, duration: DURACION_MS });
        trackMinimapa('ir');
    };

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
            <canvas
                ref={lienzoRef}
                onClick={irA}
                aria-label="Minimapa de Jalisco: clic para mover el mapa a ese punto"
                title={isDrawing ? 'Termina el trazo para usar el minimapa' : 'Clic para mover el mapa a ese punto'}
                className={`block size-full rounded-[14px] shadow-[0_6px_14px_rgba(34,26,46,0.28)] ${isDrawing ? 'cursor-default' : 'cursor-crosshair'}`}
            />
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
