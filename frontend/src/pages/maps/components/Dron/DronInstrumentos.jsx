import { useCallback, useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';
import { useLienzoDron, useTelemetriaDron } from '@hooksMaps/useTelemetriaDron';
import {
    ALTO_INSTRUMENTO, ANCHO_INSTRUMENTO, dibujarInstrumentos, dibujarPerfil, tonoAltura,
} from '@pages/maps/helpers/dron/instrumentosDron';
import DronIcono from './DronIcono';

const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
const TONOS = { peligro: 'text-[#D6336C]', aviso: 'text-[#FF8300]', '': 'text-graphite' };

const Chevron = ({ arriba }) => (
    <svg viewBox="0 0 12 12" className={`size-3 transition-transform ${arriba ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M3 7.5l3-3 3 3" />
    </svg>
);

const Dato = ({ icono, valor, unidad, tono = '', titulo }) => (
    <span className={`inline-flex items-center gap-1.5 font-garet text-[13px] font-extrabold tabular-nums transition-colors ${TONOS[tono]}`} title={titulo}>
        <span className="text-[#5C2472]"><DronIcono nombre={icono} className="size-4" /></span>
        {valor}
        <small className="text-[10.5px] font-semibold text-[#6A6180]">{unidad}</small>
    </span>
);

const tercerDato = (perfil, t) => {
    if (perfil.instr === 'horizonte') return { valor: formato.format(Math.abs((t.dron.alabeo * 180) / Math.PI)), unidad: '°', titulo: 'Alabeo' };
    if (perfil.instr === 'vario') return { valor: `${t.dron.vsReal >= 0 ? '+' : ''}${t.dron.vsReal.toFixed(1)}`, unidad: 'm/s', titulo: 'Velocidad vertical' };
    return { valor: formato.format(t.camaraGrados), unidad: '°', titulo: 'Inclinación de la cámara' };
};

const Lienzo = ({ dibujar, etiqueta, activo }) => {
    const ref = useRef(null);
    useLienzoDron(ref, dibujar, activo);
    return <canvas ref={ref} width={ANCHO_INSTRUMENTO} height={ALTO_INSTRUMENTO} aria-label={etiqueta} className="block h-auto w-[min(232px,calc(50vw-40px))] aspect-[400/170]" />;
};

const DronInstrumentos = () => {
    const { config, perfil } = useDron();
    const { isMobile } = useSider();
    const [abierto, setAbierto] = useState(true);
    const telemetria = useTelemetriaDron();
    const expandido = abierto && !isMobile;
    const conDatos = useCallback((dibujo) => (ctx, t) => dibujo(ctx, { ...t.dron, ...t, perfil, velocidad: config.velocidad }), [perfil, config.velocidad]);
    const instrumentos = useCallback((ctx, t) => conDatos(dibujarInstrumentos)(ctx, t), [conDatos]);
    const perfilTerreno = useCallback((ctx, t) => conDatos(dibujarPerfil)(ctx, t), [conDatos]);
    const tercero = telemetria ? tercerDato(perfil, telemetria) : null;

    return (
        <div className={`fixed left-1/2 z-20 -translate-x-1/2 flex flex-col items-center ${isMobile ? 'bottom-15' : 'bottom-0'}`}>
            {expandido ? (
                <div className="flex items-stretch gap-2 rounded-t-[16px] border border-b-0 border-[#5C24721F] bg-white px-2.5 pb-2 pt-2 shadow-[0_5px_20px_#1A26641A]">
                    <Lienzo dibujar={instrumentos} etiqueta="Instrumentos de vuelo" activo={expandido} />
                    <Lienzo dibujar={perfilTerreno} etiqueta="Perfil del terreno adelante" activo={expandido} />
                    <Tooltip content="Minimizar los instrumentos">
                        <button
                            type="button"
                            onClick={() => setAbierto(false)}
                            className="self-end grid size-7 place-items-center rounded-full bg-[#F0E6F6] text-[#5C2472] cursor-pointer"
                            aria-label="Minimizar los instrumentos"
                        >
                            <Chevron arriba={false} />
                        </button>
                    </Tooltip>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => !isMobile && setAbierto(true)}
                    className={`flex items-center gap-3 border border-[#5C24721F] bg-white px-3.5 py-2 shadow-[0_5px_20px_#1A26641A] ${isMobile ? 'cursor-default rounded-full' : 'cursor-pointer rounded-t-[14px] border-b-0 hover:bg-[#FCFAFF]'}`}
                    aria-label={isMobile ? 'Lecturas del vuelo' : 'Mostrar los instrumentos'}
                >
                    {telemetria && (
                        <>
                            <Dato icono="altura" valor={formato.format(telemetria.agl)} unidad="m" tono={tonoAltura(telemetria.agl)} titulo="Altura sobre el terreno" />
                            <Dato icono="velocidad" valor={formato.format(telemetria.kmh)} unidad="km/h" tono={perfil.perdida && telemetria.kmh < perfil.perdida ? 'peligro' : ''} titulo="Velocidad" />
                            <Dato icono={perfil.instr} {...tercero} />
                            {telemetria.alerta && (
                                <span className="grid size-5.5 place-items-center rounded-full bg-[#FDE8EF] text-[#D6336C] animate-pulse" title="Relieve más alto adelante">!</span>
                            )}
                        </>
                    )}
                    {!isMobile && <span className="grid size-5.5 place-items-center rounded-full bg-[#F0E6F6] text-[#5C2472]"><Chevron arriba /></span>}
                </button>
            )}
        </div>
    );
};

export default DronInstrumentos;
