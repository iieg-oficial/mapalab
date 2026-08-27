import { formatNumber } from '@pages/maps/helpers/formatNumber';

const Paso = ({ paso }) => (
    <>
        <span className="leading-tight">
            <span className="text-[#2E4372] font-medium">{paso.concepto}</span>
            {paso.detalle && <span className="text-[#465055]"> {paso.detalle}</span>}
            {paso.delContexto && <span className="text-[#FF8300]"> · del visor</span>}
        </span>
        <span className="text-right tabular-nums leading-tight text-[#465055]">
            {formatNumber(String(paso.valor))}
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
        <div className="rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] px-3 py-2.5 w-[290px] text-[10px]">
            <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 items-baseline">
                {receta.pasos
                    .filter(paso => paso.valor !== null && paso.valor !== undefined)
                    .map((paso, index) => <Paso key={index} paso={paso} />)}
            </div>

            <div className="flex items-center gap-1.5 mt-2 rounded-lg bg-[#EFF3FC] px-2 py-1.5">
                <span className="flex-1 text-[#465055] leading-tight">
                    {receta.operacion}{receta.columna ? ` ${receta.columna}` : ''}
                </span>
                <strong className="text-[14px] text-[#5C2472] tabular-nums leading-none">
                    {valor}{simbolo ? ` ${simbolo}` : ''}
                </strong>
            </div>
        </div>
    );
};

export default StatReceta;
