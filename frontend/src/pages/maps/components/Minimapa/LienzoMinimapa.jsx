import { useEffect, useRef } from 'react';
import { trackMinimapa } from '@services/analyticsService';
import { dePixel, vistaDelMinimapa } from '@pages/maps/helpers/minimapa';
import { dibujarMinimapa } from '@pages/maps/helpers/trazoMinimapa';

const DURACION_MS = 350;

const LienzoMinimapa = ({ lado, vista, siluetas, municipio, map, bloqueado, onIr }) => {
    const lienzoRef = useRef(null);
    const vistaMiniRef = useRef(null);
    const extensionEstado = siluetas?.estado?.getExtent() ?? null;

    useEffect(() => {
        if (!vista) return;
        const vistaMini = vistaDelMinimapa({ centro: vista.centro, zoom: vista.zoom, extensionEstado, lado });
        vistaMiniRef.current = vistaMini;
        const lienzo = lienzoRef.current;
        const ctx = lienzo?.getContext('2d');
        if (!ctx) return;
        const ratio = window.devicePixelRatio || 1;
        const pixeles = Math.round(lado * ratio);
        if (lienzo.width !== pixeles) {
            lienzo.width = pixeles;
            lienzo.height = pixeles;
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        dibujarMinimapa(ctx, { lado, vista: vistaMini, estado: siluetas?.estado, municipio, extensionVista: vista.extension });
    }, [lado, vista, siluetas, municipio, extensionEstado]);

    const irA = (evento) => {
        if (bloqueado || !vistaMiniRef.current) return;
        const caja = evento.currentTarget.getBoundingClientRect();
        const destino = dePixel(vistaMiniRef.current, lado, [evento.clientX - caja.left, evento.clientY - caja.top]);
        map?.getView()?.animate({ center: destino, duration: DURACION_MS });
        trackMinimapa('ir');
        onIr?.();
    };

    return (
        <canvas
            ref={lienzoRef}
            onClick={irA}
            aria-label="Minimapa de Jalisco: clic para mover el mapa a ese punto"
            title={bloqueado ? 'Termina el trazo para usar el minimapa' : 'Clic para mover el mapa a ese punto'}
            style={{ width: lado, height: lado }}
            className={`block rounded-[14px] shadow-[0_6px_14px_rgba(34,26,46,0.28)] ${bloqueado ? 'cursor-default' : 'cursor-crosshair'}`}
        />
    );
};

export default LienzoMinimapa;
