import { useEffect, useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import { basemapTileUrl } from '@pages/maps/helpers/view3d';
import { ZOOM_MINIMAPA, ZOOM_MINIMAPA_RANGO, largoDeRuta } from '@pages/maps/helpers/dron/minimapaDron';
import { dibujarMinimapa, puntoDelClic } from '@pages/maps/helpers/dron/dibujoMinimapa';
import { BotonMini, ResumenRuta } from './DronMinimapaControles';
import { ContadorRec } from './DronGrabar';
import { useGrabacionDron } from '@contexts/GrabacionDronContext';

const INTERVALO_MS = 90;
const RASTRO_MS = 1000;
const RASTRO_MAXIMO = 900;
const [ZOOM_MIN, ZOOM_MAX] = ZOOM_MINIMAPA_RANGO;

const tamano = (grande, isMobile) => {
    if (isMobile) return grande ? 'top-4 right-4 w-[calc(100vw-2rem)] h-72' : 'top-4 right-4 size-32';
    return grande ? 'bottom-14 right-4 w-[460px] h-[340px]' : 'bottom-14 right-4 size-52';
};

const DronMinimapa = () => {
    const { basemaps, baseMapId } = useMapsContext();
    const { suscribir, setAuto, telemetriaRef, ruta, rutaRef, cambiarRuta, perfil, config, minimapaPedido, rastroRef } = useDron();
    const grabacion = useGrabacionDron();
    const { isMobile } = useSider();
    const { margenes } = useAreaUtil();
    const lienzoRef = useRef(null);
    const cacheRef = useRef(new Map());
    const vistaRef = useRef(null);
    const [grande, setGrande] = useState(false);
    const [zoom, setZoom] = useState(ZOOM_MINIMAPA);
    const [rumboArriba, setRumboArriba] = useState(false);
    const [posicion, setPosicion] = useState(null);
    const plantilla = basemapTileUrl(basemaps[baseMapId]?.tiles);

    useEffect(() => { if (minimapaPedido) setGrande(true); }, [minimapaPedido]);

    useEffect(() => {
        const lienzo = lienzoRef.current;
        const ctx = lienzo?.getContext('2d');
        if (!ctx) return undefined;
        let ultimo = 0;
        let ultimoRastro = 0;
        let ultimaPosicion = 0;
        const dibujar = (t) => {
            const ratio = window.devicePixelRatio || 1;
            const [ancho, alto] = [lienzo.clientWidth, lienzo.clientHeight];
            if (lienzo.width !== Math.round(ancho * ratio) || lienzo.height !== Math.round(alto * ratio)) {
                lienzo.width = Math.round(ancho * ratio);
                lienzo.height = Math.round(alto * ratio);
            }
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            const vista = { ancho, alto, zoom, centro: t.dron.lngLat, rumbo: t.dron.rumbo, rumboArriba };
            vistaRef.current = vista;
            dibujarMinimapa(ctx, { ...vista, plantilla, cache: cacheRef.current, ruta: rutaRef.current, rastro: rastroRef.current });
        };
        if (telemetriaRef.current) dibujar(telemetriaRef.current);
        return suscribir((t) => {
            const ahora = performance.now();
            if (!t) return;
            if (ahora - ultimoRastro > RASTRO_MS) {
                ultimoRastro = ahora;
                rastroRef.current.push(t.dron.lngLat);
                if (rastroRef.current.length > RASTRO_MAXIMO) rastroRef.current.shift();
            }
            if (ahora - ultimaPosicion > 1000) {
                ultimaPosicion = ahora;
                setPosicion(t.dron.lngLat);
            }
            if (ahora - ultimo < INTERVALO_MS) return;
            ultimo = ahora;
            dibujar(t);
        });
    }, [suscribir, telemetriaRef, rutaRef, rastroRef, plantilla, zoom, rumboArriba, grande]);

    const agregarPunto = (e) => {
        const vista = vistaRef.current;
        if (!vista) return;
        const caja = lienzoRef.current.getBoundingClientRect();
        const punto = puntoDelClic(vista, [e.clientX - caja.left, e.clientY - caja.top]);
        cambiarRuta(previa => ({ ...previa, puntos: [...previa.puntos, punto], pausada: false }));
        setAuto(false);
    };
    const acercar = paso => setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + paso)));
    const alternarGrande = () => {
        setGrande(g => !g);
        setZoom(z => (grande ? Math.max(z, ZOOM_MINIMAPA) : Math.min(z, ZOOM_MINIMAPA - 1)));
    };
    const acciones = grande ? '' : `transition-opacity duration-150 ${grabacion.grabando ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100'}`;
    const metros = posicion ? largoDeRuta(posicion, ruta.puntos, ruta.ciclo) : 0;

    return (
        <div
            className={`group fixed transition-[width,height] duration-300 ${grande ? 'z-[21]' : 'z-10'} ${tamano(grande, isMobile)}`}
            style={isMobile ? undefined : { marginRight: margenes.right, marginBottom: margenes.bottom }}
        >
            <canvas
                ref={lienzoRef}
                onClick={agregarPunto}
                onWheel={e => acercar(e.deltaY > 0 ? -1 : 1)}
                onKeyDown={(e) => { if (e.key === 'Backspace') cambiarRuta(previa => ({ ...previa, puntos: previa.puntos.slice(0, -1) })); }}
                role="button"
                tabIndex={0}
                aria-label="Minimapa: clic para agregar un punto a la ruta"
                title="Clic para agregar un punto a la ruta"
                className="block size-full rounded-[14px] cursor-crosshair [filter:drop-shadow(0_5px_20px_#1A26641A)]"
            />
            <div className={`absolute right-1.5 top-1.5 flex flex-col gap-1.5 ${acciones}`}>
                <BotonMini icono={grande ? 'contraer' : 'expandir'} titulo={grande ? 'Reducir el minimapa' : 'Expandir el minimapa'} onClick={alternarGrande} />
                {(grande || !isMobile) && (
                    <BotonMini
                        icono={rumboArriba ? 'rumbo' : 'norte'}
                        titulo={rumboArriba ? 'Poner el norte arriba' : 'Girar con el rumbo del dron'}
                        onClick={() => setRumboArriba(r => !r)}
                        activo={rumboArriba}
                    />
                )}
            </div>
            <div className={`absolute bottom-1.5 left-1.5 flex flex-col gap-1.5 ${acciones}`}>
                <BotonMini icono="mas" titulo="Acercar" onClick={() => acercar(1)} disabled={zoom >= ZOOM_MAX} />
                <BotonMini icono="menos" titulo="Alejar" onClick={() => acercar(-1)} disabled={zoom <= ZOOM_MIN} />
            </div>
            {grabacion.grabando && <ContadorRec segundos={grabacion.segundos} tope={grabacion.topeActual} onDetener={grabacion.detener} />}
            {grande && ruta.puntos.length > 0 && (
                <div className="pointer-events-none absolute bottom-2 right-2 flex justify-end">
                    <ResumenRuta
                        ruta={ruta}
                        metros={metros}
                        kmh={perfil.vel[config.velocidad]}
                        grabando={grabacion.grabando}
                        onGrabar={grabacion.grabando ? grabacion.detener : () => grabacion.abrirTarjeta(true)}
                        onPausar={() => cambiarRuta({ pausada: !ruta.pausada })}
                        onCiclo={() => cambiarRuta({ ciclo: !ruta.ciclo })}
                        onDeshacer={() => cambiarRuta(previa => ({ ...previa, puntos: previa.puntos.slice(0, -1) }))}
                        onBorrar={() => cambiarRuta({ puntos: [], pausada: false })}
                    />
                </div>
            )}
        </div>
    );
};

export default DronMinimapa;
