import { cancelarGiro, useEstadoGiro } from '@hooksMaps/useEstadoGiro';

const TEXTOS = {
    eligiendo: 'Haz clic en el mapa para elegir el centro de la vuelta',
    preparando: 'Preparando la vuelta…',
    grabando: 'Grabando la vuelta',
    guardando: 'Guardando el archivo…',
};

const Giratorio = () => (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="#F0E6F6" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="#FF8300" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const PildoraGrabacionGiro = ({ enLinea = false }) => {
    const { fase, progreso } = useEstadoGiro();
    if (!fase) return null;
    const porcentaje = Math.round((progreso || 0) * 100);
    const cancelable = fase !== 'guardando';

    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-2.5 rounded-full bg-white px-3.5 py-2 font-garet text-[12.5px] font-bold text-[#465055] ${enLinea ? '' : 'pointer-events-auto fixed left-1/2 top-24 z-30 -translate-x-1/2 shadow-[0_5px_20px_#1A26641A]'}`}
        >
            {fase === 'grabando' ? <i className="size-2 shrink-0 rounded-full bg-[#D6336C] motion-safe:animate-pulse" /> : <Giratorio />}
            <span className="whitespace-nowrap">{TEXTOS[fase]}{fase === 'grabando' ? ` · ${porcentaje} %` : ''}</span>
            {fase === 'grabando' && (
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[#F0E6F6]">
                    <span className="block h-full rounded-full bg-[#FF8300] transition-[width] duration-200" style={{ width: `${porcentaje}%` }} />
                </span>
            )}
            {cancelable && (
                <button type="button" onClick={cancelarGiro} className="text-[#5C2472] underline cursor-pointer">Cancelar</button>
            )}
        </div>
    );
};

export default PildoraGrabacionGiro;
