import { useEffect, useRef } from 'react';
import { trackMinimapa } from '@services/analyticsService';
import { dePixel, vistaDelMinimapa } from '@pages/maps/helpers/minimapa';
import { dibujarMinimapa } from '@pages/maps/helpers/trazoMinimapa';

const DURACION_MS = 350;
const ARRASTRE_PX = 4;

const LienzoMinimapa = ({ lado, vista, siluetas, municipio, map, bloqueado, onIr, atenuado = false, alIr }) => {
    const lienzoRef = useRef(null);
    const inicioRef = useRef(null);
    const vistaMiniRef = useRef(null);
    const extensionEstado = siluetas?.estado?.getExtent() ?? null;
    const extensionMunicipio = municipio?.geometry?.getExtent() ?? null;

    useEffect(() => {
        if (!vista) return;
        const vistaMini = vistaDelMinimapa({ centro: vista.centro, zoom: vista.zoom, extensionEstado, extensionMunicipio, lado });
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
        dibujarMinimapa(ctx, { lado, vista: vistaMini, estado: siluetas?.estado, municipio, extensionVista: vista.extension, atenuado });
    }, [lado, vista, siluetas, municipio, extensionEstado, extensionMunicipio, atenuado]);

    const irA = (evento) => {
        const inicio = inicioRef.current;
        const arrastro = inicio && Math.hypot(evento.clientX - inicio[0], evento.clientY - inicio[1]) > ARRASTRE_PX;
        if (arrastro || bloqueado || !vistaMiniRef.current) return;
        const caja = evento.currentTarget.getBoundingClientRect();
        const destino = dePixel(vistaMiniRef.current, lado, [evento.clientX - caja.left, evento.clientY - caja.top]);
        if (alIr) alIr(destino, DURACION_MS);
        else map?.getView()?.animate({ center: destino, duration: DURACION_MS });
        trackMinimapa('ir');
        onIr?.();
    };

    return (
        <canvas
            ref={lienzoRef}
            onPointerDown={(evento) => { inicioRef.current = [evento.clientX, evento.clientY]; }}
            onClick={irA}
            aria-label="Minimapa de Jalisco: clic para mover el mapa a ese punto"
            title={bloqueado ? 'Termina el trazo para usar el minimapa' : 'Clic para mover el mapa a ese punto'}
            style={{ width: lado, height: lado }}
            className={`block ${bloqueado ? 'cursor-default' : 'cursor-crosshair'}`}
        />
    );
};

export default LienzoMinimapa;
