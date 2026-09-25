import { useEffect, useRef, useState } from 'react';
import { useDron } from '@contexts/DronContext';

const OCULTAR_MS = 700;
const TACTIL_MS = 3500;

const Pildora = ({ activo, onClick, titulo, children, color = null }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={color ? undefined : activo}
        title={titulo}
        className={`pointer-events-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-0 px-2 py-1 font-garet text-[9.5px] font-extrabold tracking-[0.08em] shadow-[0_2px_8px_#221A2E2E] cursor-pointer transition-colors ${color ? 'bg-white text-graphite' : activo ? 'bg-[#1F9D55] text-white' : 'bg-[#ECE8F1] text-[#6A6180]'}`}
    >
        <i
            className={`size-1.5 rounded-full ${color ? 'ring-2 ring-white outline outline-1 outline-[#221A2E33]' : activo ? 'bg-white' : 'bg-[#B7AEC4]'}`}
            style={color ? { background: color } : undefined}
        />
        <span className="max-md:hidden">{children}</span>
    </button>
);

const DronSobre = () => {
    const { auto, setAuto, config, alternar, cambiarColor, suscribir } = useDron();
    const autoRef = useRef(null);
    const opcionesRef = useRef(null);
    const temporizador = useRef(null);
    const [opciones, setOpciones] = useState(false);
    const [choque, setChoque] = useState(false);

    useEffect(() => suscribir((t) => {
        if (!t || !autoRef.current || !opcionesRef.current) return;
        setChoque(!!t.choque);
        const centro = window.innerHeight * 0.62;
        const { x, arriba, abajo } = t.pantalla || { x: window.innerWidth / 2, arriba: centro - 12, abajo: centro + 12 };
        autoRef.current.style.transform = `translate(${x}px, ${arriba}px) translate(-50%, -100%)`;
        opcionesRef.current.style.transform = `translate(${x}px, ${abajo}px) translate(-50%, 0)`;
    }), [suscribir]);

    useEffect(() => () => clearTimeout(temporizador.current), []);

    const mostrar = () => {
        clearTimeout(temporizador.current);
        setOpciones(true);
    };
    const ocultar = (ms = OCULTAR_MS) => {
        clearTimeout(temporizador.current);
        temporizador.current = setTimeout(() => setOpciones(false), ms);
    };

    return (
        <>
            <button
                ref={autoRef}
                type="button"
                onClick={() => setAuto(!auto)}
                onPointerEnter={e => e.pointerType !== 'touch' && mostrar()}
                onPointerLeave={e => e.pointerType !== 'touch' && ocultar()}
                onPointerUp={(e) => { if (e.pointerType === 'touch') { mostrar(); ocultar(TACTIL_MS); } }}
                aria-pressed={auto}
                title="Piloto automático (P)"
                className={`fixed left-0 top-0 z-20 flex items-center gap-1.5 rounded-full border-0 px-2 py-1 font-garet text-[9.5px] font-extrabold tracking-[0.08em] text-white shadow-[0_2px_8px_#221A2E40] cursor-pointer ${choque ? 'bg-[#D6336C]' : auto ? 'bg-[#FF8300] motion-safe:animate-pulse' : 'bg-[#1F9D55]'}`}
            >
                <i className="size-1.5 rounded-full bg-white" />
                {choque ? 'CHOQUE' : auto ? 'AUTO' : 'MANUAL'}
            </button>
            <div
                ref={opcionesRef}
                onPointerEnter={mostrar}
                onPointerLeave={() => ocultar()}
                className={`fixed left-0 top-0 z-20 pt-1.5 transition-opacity duration-200 ${opciones ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                <div className="flex gap-1">
                    <Pildora activo={config.tercera} onClick={() => alternar('tercera')} titulo="Primera o tercera persona (V)">
                        {config.tercera ? '3ª PERSONA' : '1ª PERSONA'}
                    </Pildora>
                    <Pildora color={config.color} onClick={cambiarColor} titulo="Cambiar color">COLOR</Pildora>
                    <Pildora activo={config.estela} onClick={() => alternar('estela')} titulo="Estela del recorrido">ESTELA</Pildora>
                    <Pildora activo={config.luces} onClick={() => alternar('luces')} titulo="Luces de navegación">LUCES</Pildora>
                    <Pildora activo={config.foco} onClick={() => alternar('foco')} titulo="Cono de la cámara">CONO</Pildora>
                </div>
            </div>
        </>
    );
};

export default DronSobre;
