import Icon from '@components/Icon';
import { formatNumber } from '@pages/maps/helpers/formatNumber';

const Paso = ({ paso }) => (
    <>
        <span className="leading-tight">
            <span className="block text-[#2E4372] font-medium">{paso.concepto}</span>
            {paso.detalle && <span className="block text-[9px] text-[#465055]">{paso.detalle}</span>}
        </span>
        <span className="self-end text-right tabular-nums leading-tight font-bold text-purple">
            {formatNumber(String(paso.valor))}
        </span>
    </>
);

const Puntero = ({ x, abajo }) => (
    <span
        className={`absolute w-3 h-3 rotate-45 bg-white ${abajo ? '-bottom-1.5' : '-top-1.5'}`}
        style={{ left: x - 6 }}
        aria-hidden="true"
    />
);

const proporcion = (pasos) => {
    if (!pasos || pasos.length < 2) return null;
    const universo = Number(pasos[0].valor);
    const resultado = Number(pasos[pasos.length - 1].valor);
    if (!universo || !Number.isFinite(resultado) || universo === resultado) return null;
    const pct = (resultado / universo) * 100;
    return `${pct < 0.1 ? '<0.1' : pct.toFixed(1)}% de ${formatNumber(String(universo))}`;
};

const StatReceta = ({ receta, valor, simbolo, titulo, onCerrar, puntero = null, punteroAbajo = true }) => {
    if (!receta) return null;

    if (receta.tipo !== 'primitiva') {
        return (
            <div className="rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] px-3 py-2 text-[11px] text-[#465055]">
                {receta.operacion}
            </div>
        );
    }

    return (
        <div className="relative rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] px-3 py-2.5 w-[290px] text-[10px]">
            {puntero !== null && <Puntero x={puntero} abajo={punteroAbajo} />}

            <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-[11px] font-bold text-[#2E4372] leading-tight">{titulo}</p>
                {onCerrar && (
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="size-5 shrink-0 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                        aria-label="Cerrar el detalle del cálculo"
                    >
                        <Icon name="close" className="size-3" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 items-baseline">
                {receta.pasos
                    .filter(paso => paso.valor !== null && paso.valor !== undefined)
                    .map((paso, index) => <Paso key={index} paso={paso} />)}
            </div>

            <div className="flex items-center gap-1.5 mt-2 rounded-lg bg-[#EFF3FC] px-2 py-1.5">
                <span className="flex-1 leading-tight">
                    <span className="block text-[#465055]">
                        {receta.operacion}{receta.columna ? ` ${receta.columna}` : ''}
                    </span>
                    {proporcion(receta.pasos) && (
                        <span className="block text-[9px] text-[#465055]">{proporcion(receta.pasos)}</span>
                    )}
                </span>
                <strong className="text-[14px] text-orange tabular-nums leading-none">
                    {valor}{simbolo ? ` ${simbolo}` : ''}
                </strong>
            </div>
        </div>
    );
};

export default StatReceta;
