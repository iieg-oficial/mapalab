import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { SLOT_COLORS } from '@pages/maps/helpers/swipeTheme';
import { filasDeLados } from '@pages/maps/helpers/numeraliaLados';

const TONO_LADO = { A: SLOT_COLORS.A.fg, B: '#B85C00' };

const textoDelta = (delta) => {
    const redondo = Number.isInteger(delta) ? delta : Number(delta.toFixed(2));
    const signo = redondo > 0 ? '+' : redondo < 0 ? '−' : '';
    return `${signo}${formatNumber(String(Math.abs(redondo)))}`;
};

const Encabezado = ({ lado, periodo }) => (
    <span className="flex flex-col items-end leading-none">
        <span
            className="px-2 py-0.5 rounded-full text-[10px]/[12px] font-bold"
            style={{ color: TONO_LADO[lado], backgroundColor: SLOT_COLORS[lado].bg }}
        >
            {lado}
        </span>
        <span className="mt-1 text-[9px]/[11px] text-[#8894AE] tabular-nums">{periodo || '—'}</span>
    </span>
);

const Valor = ({ valor, simbolo }) => (
    <span className="text-right font-garet text-[15px]/[22px] font-bold tabular-nums text-[#191919]">
        {valor === null ? '—' : `${formatNumber(String(valor))}${simbolo ? ` ${simbolo}` : ''}`}
    </span>
);

const Delta = ({ fila }) => {
    if (fila.delta === null) return <span className="text-right text-[11px]/[14px] text-[#A9B4CC]">—</span>;
    const tono = fila.delta > 0 ? 'text-[#24573F]' : fila.delta < 0 ? 'text-[#8B2B3D]' : 'text-[#8894AE]';
    return (
        <span className={`flex flex-col items-end leading-none tabular-nums ${tono}`}>
            <span className="text-[12px]/[16px] font-bold">{textoDelta(fila.delta)}</span>
            {fila.cambio !== null && (
                <span className="text-[9px]/[11px]">{`${fila.cambio > 0 ? '+' : ''}${fila.cambio.toFixed(1)}%`}</span>
            )}
        </span>
    );
};

const ResumenLados = ({ lado, metadata, metadataOtro }) => {
    const [a, b] = lado === 'B' ? [metadataOtro, metadata] : [metadata, metadataOtro];
    const filas = filasDeLados(a?.numeralia, b?.numeralia);
    return (
        <div className="grid grid-cols-[minmax(140px,1fr)_auto_auto_auto] gap-x-4 gap-y-1.5 items-center">
            <span />
            <Encabezado lado="A" periodo={a?.ambito?.temporal} />
            <Encabezado lado="B" periodo={b?.ambito?.temporal} />
            <span className="text-right text-[10px]/[12px] font-bold text-[#8894AE]">Δ</span>
            {filas.map(fila => (
                <div key={fila.nombre} className="contents">
                    <span className="text-[11px]/[14px] font-garet text-[#465055]">{fila.nombre}</span>
                    <Valor valor={fila.a} simbolo={fila.simbolo} />
                    <Valor valor={fila.b} simbolo={fila.simbolo} />
                    <Delta fila={fila} />
                </div>
            ))}
        </div>
    );
};

export default ResumenLados;
