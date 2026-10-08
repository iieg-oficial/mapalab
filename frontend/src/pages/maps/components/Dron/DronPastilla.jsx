import { useEffect, useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';
import DronIcono from './DronIcono';
import DronMenuAeronave from './DronMenuAeronave';
import DronTeclas from './DronTeclas';
import { TarjetaGrabar } from './DronGrabar';
import Map3DPopover from '../Map3D/Map3DPopover';
import { useGrabacionDron } from '@contexts/GrabacionDronContext';

const BOTON = 'flex items-center justify-center size-7 rounded-full shrink-0 cursor-pointer transition-colors';
const tono = activo => (activo ? 'bg-[#5C2472] text-white' : 'text-[#7C8BAD] hover:text-[#5C2472]');

const Flecha = ({ abierto }) => (
    <svg viewBox="0 0 24 24" className={`size-6 transition-transform ${abierto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
    </svg>
);

const Rec = () => (
    <svg viewBox="0 0 20 20" className="size-6" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="10" r="4.5" fill="#D6336C" />
    </svg>
);

const DronPastilla = () => {
    const { perfil, config, salir, instrumentosAbiertos, setInstrumentosAbiertos } = useDron();
    const grabacion = useGrabacionDron();
    const { isMobile } = useSider();
    const [abierto, setAbierto] = useState(null);
    useEffect(() => {
        if (isMobile) return undefined;
        const espera = setTimeout(() => setAbierto(previo => previo ?? 'teclas'), 650);
        return () => clearTimeout(espera);
    }, [isMobile]);
    const barraRef = useRef(null);
    const alternarPanel = (cual) => {
        grabacion.cerrarTarjeta();
        setAbierto(previo => (previo === cual ? null : cual));
    };
    const cerrar = () => setAbierto(null);

    return (
        <div ref={barraRef} className="flex flex-col items-center w-11 rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A] [&>*]:h-10 [&>*]:flex [&>*]:items-center [&>*]:justify-center">
            <Tooltip content={instrumentosAbiertos ? 'Minimizar los instrumentos' : 'Mostrar los instrumentos'}>
                <button
                    type="button"
                    className={`${BOTON} ${tono(instrumentosAbiertos && !isMobile)} ${isMobile ? 'opacity-40 cursor-not-allowed' : ''}`}
                    onClick={() => !isMobile && setInstrumentosAbiertos(v => !v)}
                    aria-pressed={instrumentosAbiertos}
                    aria-label={instrumentosAbiertos ? 'Minimizar los instrumentos' : 'Mostrar los instrumentos'}
                >
                    <Flecha abierto={instrumentosAbiertos} />
                </button>
            </Tooltip>
            <Tooltip content={grabacion.grabando ? 'Detener y descargar el video' : 'Grabar el vuelo o una ruta'}>
                <button
                    type="button"
                    className={`${BOTON} ${tono(grabacion.tarjeta.abierta)} ${grabacion.grabando ? 'motion-safe:animate-pulse' : ''}`}
                    onClick={grabacion.grabando ? grabacion.detener : () => (grabacion.tarjeta.abierta ? grabacion.cerrarTarjeta() : grabacion.abrirTarjeta())}
                    aria-pressed={grabacion.tarjeta.abierta}
                    aria-label={grabacion.grabando ? 'Detener y descargar el video' : 'Grabar el vuelo o una ruta'}
                >
                    <Rec />
                </button>
            </Tooltip>
            <Tooltip content={`Aeronave: ${perfil.nombre}`}>
                <button
                    type="button"
                    className={`${BOTON} ${tono(abierto === 'aeronave')}`}
                    onClick={() => alternarPanel('aeronave')}
                    aria-haspopup="dialog"
                    aria-expanded={abierto === 'aeronave'}
                    aria-label={`Cambiar aeronave, ahora ${perfil.nombre}`}
                >
                    <DronIcono nombre={config.modelo} className="size-6" />
                </button>
            </Tooltip>
            <Tooltip content="Teclas del modo dron">
                <button
                    type="button"
                    className={`${BOTON} ${tono(abierto === 'teclas')}`}
                    onClick={() => alternarPanel('teclas')}
                    aria-haspopup="dialog"
                    aria-expanded={abierto === 'teclas'}
                    aria-label="Teclas del modo dron"
                >
                    <DronIcono nombre="teclas" className="size-6" />
                </button>
            </Tooltip>
            <PillCloseButton
                onClick={salir}
                size="pastilla"
                reveal="siempre"
                tooltip="Al dar clic sales del modo dron"
                ariaLabel="Salir del modo dron"
            />
            {abierto === 'aeronave' && <DronMenuAeronave anchorRef={barraRef} bordeRef={barraRef} onClose={cerrar} />}
            {abierto === 'teclas' && <DronTeclas anchorRef={barraRef} bordeRef={barraRef} onClose={cerrar} />}
            {grabacion.tarjeta.abierta && !grabacion.grabando && (
                <Map3DPopover
                    anchorRef={barraRef}
                    bordeRef={barraRef}
                    onClose={grabacion.cerrarTarjeta}
                    width={320}
                    alinear="abajo"
                    etiqueta="Grabar el vuelo"
                    className="rounded-[12px] bg-[#F9FBFF] p-3 shadow-[0_5px_20px_#1A26641A]"
                >
                    <TarjetaGrabar
                        tope={grabacion.tope}
                        puntos={grabacion.puntos}
                        resaltar={grabacion.tarjeta.resaltar}
                        error={grabacion.error}
                        onGrabar={grabacion.grabar}
                        onPng={grabacion.descargarPng}
                        onCerrar={grabacion.cerrarTarjeta}
                    />
                </Map3DPopover>
            )}
        </div>
    );
};

export default DronPastilla;
