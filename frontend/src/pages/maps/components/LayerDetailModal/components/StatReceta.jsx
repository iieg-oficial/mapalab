import { formatNumber } from '@pages/maps/helpers/formatNumber';

const Paso = ({ paso }) => (
    <>
        <span className="text-[13px] font-bold text-[#5C2472] text-center leading-tight" aria-hidden="true">
            {paso.signo || ''}
        </span>
        <span className="leading-tight">
            <span className="text-[#2E4372] font-medium">{paso.concepto}</span>
            {paso.detalle && <span className="text-[#465055]"> {paso.detalle}</span>}
            {paso.delContexto && <span className="text-[#FF8300]"> · del visor</span>}
        </span>
        <span className="text-right tabular-nums text-[#465055] leading-tight">
            {paso.valor === null || paso.valor === undefined ? '—' : formatNumber(String(paso.valor))}
        </span>
    </>
);

const StatReceta = ({ receta, valor, simbolo }) => {
    if (!receta) return null;

    if (receta.tipo !== 'primitiva') {
        return (
            <div className="rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] px-3 py-2 text-[11px] text-[#465055]">
                {receta.operacion}
            </div>
        );
    }

    return (
        <div className="rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] px-3 py-2.5 w-[270px] text-[10px]">
            <div className="grid grid-cols-[16px_1fr_auto] gap-x-1.5 gap-y-1 items-baseline">
                {receta.pasos.map((paso, index) => <Paso key={index} paso={paso} />)}
            </div>

            <div className="grid grid-cols-[16px_1fr_auto] gap-x-1.5 items-baseline mt-1.5 pt-1.5 border-t border-[#E2E8F4]">
                <span className="text-[15px] font-bold text-[#5C2472] text-center leading-none" aria-hidden="true">=</span>
                <span className="text-[#465055] leading-tight">
                    {receta.operacion}{receta.columna ? ` ${receta.columna}` : ''}
                </span>
                <strong className="text-[13px] text-[#5C2472] tabular-nums leading-tight">
                    {valor}{simbolo ? ` ${simbolo}` : ''}
                </strong>
            </div>

            {receta.omitidos?.length > 0 && (
                <p className="mt-2 leading-snug text-[#465055]">
                    Sin filtro de {receta.omitidos.join(' ni ')}: la cifra es de todo el estado y todo el periodo.
                </p>
            )}
        </div>
    );
};

export default StatReceta;
