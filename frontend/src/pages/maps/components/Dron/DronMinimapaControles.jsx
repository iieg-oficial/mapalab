import Tooltip from '@components/Tooltip';

const TRAZOS = {
    expandir: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />,
    contraer: <path d="M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7" />,
    mas: <path d="M12 5v14M5 12h14" />,
    menos: <path d="M5 12h14" />,
    rumbo: <path d="M12 3l5 16-5-4-5 4z" />,
    norte: <><path d="M12 3l5 16-5-4-5 4z" /><path d="M9 3h6" /></>,
    pausa: <path d="M8 5v14M16 5v14" />,
    seguir: <path d="M7 4.5v15l12-7.5z" />,
    ciclo: <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4" />,
    deshacer: <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />,
    borrar: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
};

export const BotonMini = ({ icono, titulo, onClick, activo = false, disabled = false }) => (
    <Tooltip content={titulo}>
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={titulo}
            aria-pressed={activo || undefined}
            className={`grid size-7 place-items-center rounded-full shadow-[0_2px_8px_#221A2E26] cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${activo ? 'bg-[#5C2472] text-white' : 'bg-white/95 text-[#5C2472] hover:bg-[#F0E6F6]'}`}
        >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {TRAZOS[icono]}
            </svg>
        </button>
    </Tooltip>
);

const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

const tiempo = (minutos) => {
    if (!Number.isFinite(minutos)) return '';
    if (minutos < 1) return 'menos de 1 min';
    if (minutos < 60) return `${Math.round(minutos)} min`;
    return `${Math.floor(minutos / 60)} h ${Math.round(minutos % 60)} min`;
};

export const ResumenRuta = ({ ruta, metros, kmh, onPausar, onCiclo, onDeshacer, onBorrar }) => (
    <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-3 pr-1 shadow-[0_2px_8px_#221A2E26]">
        <span className="font-garet text-[11px] font-bold tabular-nums text-graphite whitespace-nowrap">
            {ruta.puntos.length} {ruta.puntos.length === 1 ? 'punto' : 'puntos'} · {formato.format(metros / 1000)} km · {tiempo((metros / 1000 / kmh) * 60)}
        </span>
        <BotonMini icono={ruta.pausada ? 'seguir' : 'pausa'} titulo={ruta.pausada ? 'Seguir la ruta' : 'Pausar la ruta'} onClick={onPausar} />
        <BotonMini icono="ciclo" titulo={ruta.ciclo ? 'Recorrer una sola vez' : 'Repetir la ruta en ciclo'} onClick={onCiclo} activo={ruta.ciclo} />
        <BotonMini icono="deshacer" titulo="Quitar el último punto" onClick={onDeshacer} />
        <BotonMini icono="borrar" titulo="Borrar la ruta" onClick={onBorrar} />
    </div>
);
