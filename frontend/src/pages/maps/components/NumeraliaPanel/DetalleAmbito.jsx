import { SLOT_COLORS } from '@pages/maps/helpers/swipeTheme';

const TONO_LADO = { A: SLOT_COLORS.A.fg, B: '#B85C00' };

const DetalleAmbito = ({ lado, ambos, modo, ambito, creando }) => (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px]/[13px] font-garet font-bold tracking-normal min-w-0">
        {lado && !ambos && (
            <span className="px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: TONO_LADO[lado], backgroundColor: SLOT_COLORS[lado].bg }}>
                {`Lado ${lado}`}
            </span>
        )}
        {modo === 'resumen' && <span className="px-2 py-0.5 rounded-full bg-[#F0EAF3] text-purple whitespace-nowrap">{ambito?.geografico || 'Jalisco'}</span>}
        {ambito?.temporal && !creando && !(ambos && modo === 'resumen') && <span className="text-orange">{ambito.temporal}</span>}
    </p>
);

export default DetalleAmbito;
