import { useCallback, useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';
import { useLienzoDron, useTelemetriaDron } from '@hooksMaps/useTelemetriaDron';
import {
    ALTO_INSTRUMENTO, ANCHO_INSTRUMENTO, dibujarInstrumentos, dibujarPerfil, tonoAltura, zonaDelInstrumento,
} from '@pages/maps/helpers/dron/instrumentosDron';
import DronIcono from './DronIcono';
import DronSobre from './DronSobre';

const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
const TONOS = { peligro: 'text-[#D6336C]', aviso: 'text-[#FF8300]', '': 'text-graphite' };

const Candado = () => (
    <span className="grid size-5 place-items-center rounded-full bg-[#F0E6F6] text-[#5C2472]" title="Altura fija sobre el terreno">
        <svg viewBox="0 0 16 16" className="size-3" fill="currentColor" aria-hidden="true">
            <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <rect x="3.5" y="7" width="9" height="7" rx="1.5" />
        </svg>
    </span>
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

const TITULOS_ZONA = {
    altimetro: 'Clic para fijar o soltar la altura sobre el terreno',
    velocimetro: 'Clic para cambiar la velocidad (1, 2, 3)',
};

const zonaDelEvento = (evento) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    return zonaDelInstrumento(((evento.clientX - caja.left) / caja.width) * ANCHO_INSTRUMENTO);
};

const Lienzo = ({ dibujar, etiqueta, activo, onZona }) => {
    const ref = useRef(null);
    const [zona, setZona] = useState(null);
    useLienzoDron(ref, dibujar, activo);
    return (
        <canvas
            ref={ref}
            width={ANCHO_INSTRUMENTO}
            height={ALTO_INSTRUMENTO}
            aria-label={etiqueta}
            title={zona ? TITULOS_ZONA[zona] : undefined}
            onMouseMove={onZona ? e => setZona(zonaDelEvento(e)) : undefined}
            onMouseLeave={onZona ? () => setZona(null) : undefined}
            onClick={onZona ? (e) => { const z = zonaDelEvento(e); if (z) onZona(z); } : undefined}
            className={`block h-auto w-[min(232px,calc(50vw-40px))] aspect-[400/170] ${zona ? 'cursor-pointer' : ''}`}
        />
    );
};

const DronInstrumentos = () => {
    const { config, perfil, setOpcion, alternar, instrumentosAbiertos, setInstrumentosAbiertos } = useDron();
    const { isMobile } = useSider();
    const telemetria = useTelemetriaDron();
    const [pulso, setPulso] = useState(0);
    const expandido = instrumentosAbiertos && !isMobile;
    const conDatos = useCallback((dibujo) => (ctx, t) => dibujo(ctx, { ...t.dron, ...t, perfil, velocidad: config.velocidad, seguir: config.seguir }), [perfil, config.velocidad, config.seguir]);
    const alZona = (zona) => {
        if (zona === 'velocimetro') setOpcion('velocidad', (config.velocidad + 1) % 3);
        if (zona === 'altimetro') {
            alternar('seguir');
            setPulso(n => n + 1);
        }
    };
    const instrumentos = useCallback((ctx, t) => conDatos(dibujarInstrumentos)(ctx, t), [conDatos]);
    const perfilTerreno = useCallback((ctx, t) => conDatos(dibujarPerfil)(ctx, t), [conDatos]);
    const tercero = telemetria ? tercerDato(perfil, telemetria) : null;

    return (
        <div className={`fixed left-1/2 z-20 -translate-x-1/2 flex flex-col items-center ${isMobile ? 'bottom-15' : 'bottom-0'}`}>
            <DronSobre />
            {expandido ? (
                <div className="flex items-stretch gap-2 rounded-t-[16px] border border-b-0 border-[#5C24721F] bg-white px-2.5 pb-2 pt-2 shadow-[0_5px_20px_#1A26641A]">
                    <div className="relative">
                        <Lienzo dibujar={instrumentos} etiqueta="Instrumentos de vuelo" activo={expandido} onZona={alZona} />
                        {pulso > 0 && <span key={pulso} className="pointer-events-none absolute left-[11.75%] top-[5.3%] size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5C2472]/40 motion-safe:animate-[ping_0.7s_ease-out_1]" />}
                    </div>
                    <Lienzo dibujar={perfilTerreno} etiqueta="Perfil del terreno adelante" activo={expandido} />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => !isMobile && setInstrumentosAbiertos(true)}
                    className={`flex items-center gap-3 border border-[#5C24721F] bg-white px-3.5 py-2 shadow-[0_5px_20px_#1A26641A] ${isMobile ? 'cursor-default rounded-full' : 'cursor-pointer rounded-t-[14px] border-b-0 hover:bg-[#FCFAFF]'}`}
                    aria-label={isMobile ? 'Lecturas del vuelo' : 'Mostrar los instrumentos'}
                >
                    {telemetria && (
                        <>
                            <Dato icono="altura" valor={formato.format(telemetria.agl)} unidad="m" tono={tonoAltura(telemetria.agl)} titulo="Altura sobre el terreno" />
                            {config.seguir && <Candado />}
                            <Dato icono="velocidad" valor={formato.format(telemetria.kmh)} unidad="km/h" tono={perfil.perdida && telemetria.kmh < perfil.perdida ? 'peligro' : ''} titulo="Velocidad" />
                            <span className="font-garet text-[11px] font-extrabold tabular-nums text-[#5C2472]" title={`Velocidad ${config.velocidad + 1} de 3`}>{'›'.repeat(config.velocidad + 1)}<span className="text-[#D9D2E1]">{'›'.repeat(2 - config.velocidad)}</span></span>
                            <Dato icono={perfil.instr} {...tercero} />
                            {telemetria.alerta && (
                                <span className="grid size-5.5 place-items-center rounded-full bg-[#FDE8EF] text-[#D6336C] animate-pulse" title="Relieve más alto adelante">!</span>
                            )}
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default DronInstrumentos;
