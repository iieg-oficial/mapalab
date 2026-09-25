import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import { basemapTileUrl } from '@pages/maps/helpers/view3d';
import {
    ZOOM_MINIMAPA, aMinimapa, deMinimapa, teselasVisibles, urlTesela,
} from '@pages/maps/helpers/dron/minimapaDron';

const INTERVALO_MS = 90;

const flecha = (ctx, x, y, rumbo, escala) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rumbo * Math.PI) / 180);
    ctx.scale(escala, escala);
    const brillo = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    brillo.addColorStop(0, 'rgba(255, 131, 0, 0.35)');
    brillo.addColorStop(1, 'rgba(255, 131, 0, 0)');
    ctx.fillStyle = brillo;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 40, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5C2472';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
};

const DronMinimapa = () => {
    const { basemaps, baseMapId } = useMapsContext();
    const { suscribir, destinoRef, setAuto, telemetriaRef } = useDron();
    const { isMobile } = useSider();
    const { margenes } = useAreaUtil();
    const lienzoRef = useRef(null);
    const teselasRef = useRef(new Map());
    const plantilla = basemapTileUrl(basemaps[baseMapId]?.tiles);

    useEffect(() => {
        const lienzo = lienzoRef.current;
        const ctx = lienzo?.getContext('2d');
        if (!ctx) return undefined;
        const teselas = teselasRef.current;
        let ultimo = 0;
        const dibujar = (t) => {
            const ratio = window.devicePixelRatio || 1;
            const [ancho, alto] = [lienzo.clientWidth, lienzo.clientHeight];
            if (lienzo.width !== ancho * ratio) {
                lienzo.width = ancho * ratio;
                lienzo.height = alto * ratio;
            }
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            ctx.fillStyle = '#EEF1F4';
            ctx.fillRect(0, 0, ancho, alto);
            const centro = t.dron.lngLat;
            if (plantilla) {
                teselasVisibles(centro, ancho, alto, ZOOM_MINIMAPA).forEach(({ tx, ty, x, y }) => {
                    const url = urlTesela(plantilla, ZOOM_MINIMAPA, tx, ty);
                    let img = teselas.get(url);
                    if (!img) {
                        img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = url;
                        teselas.set(url, img);
                    }
                    if (img.complete && img.naturalWidth) ctx.drawImage(img, x, y, 256, 256);
                });
            }
            const destino = destinoRef.current;
            if (destino) {
                const [dx, dy] = aMinimapa(centro, destino, ancho, alto, ZOOM_MINIMAPA);
                ctx.strokeStyle = '#FF8300';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 4]);
                ctx.beginPath(); ctx.moveTo(ancho / 2, alto / 2); ctx.lineTo(dx, dy); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#FF8300';
                ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fill();
            }
            flecha(ctx, ancho / 2, alto / 2, t.dron.rumbo, 1);
        };
        if (telemetriaRef.current) dibujar(telemetriaRef.current);
        return suscribir((t) => {
            const ahora = performance.now();
            if (!t || ahora - ultimo < INTERVALO_MS) return;
            ultimo = ahora;
            dibujar(t);
        });
    }, [suscribir, destinoRef, telemetriaRef, plantilla]);

    const volarA = (e) => {
        const t = telemetriaRef.current;
        if (!t) return;
        const caja = lienzoRef.current.getBoundingClientRect();
        destinoRef.current = deMinimapa(t.dron.lngLat, [e.clientX - caja.left, e.clientY - caja.top], caja.width, caja.height, ZOOM_MINIMAPA);
        setAuto(false);
    };

    return (
        <canvas
            ref={lienzoRef}
            onClick={volarA}
            onKeyDown={(e) => { if (e.key === 'Escape') destinoRef.current = null; }}
            role="button"
            tabIndex={-1}
            aria-label="Minimapa: clic para volar a ese punto"
            title="Clic para volar a ese punto"
            className={`fixed z-10 block rounded-[14px] cursor-crosshair [filter:drop-shadow(0_6px_14px_rgba(34,26,46,0.28))] ${isMobile ? 'top-44 right-4 size-28' : 'bottom-14 right-4 size-44'}`}
            style={isMobile ? undefined : { marginRight: margenes.right, marginBottom: margenes.bottom }}
        />
    );
};

export default DronMinimapa;
