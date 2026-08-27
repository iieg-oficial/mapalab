import { formatNumber } from '@pages/maps/helpers/formatNumber';

const Paso = ({ paso }) => (
    <>
        <span
            className={`text-[13px] font-bold text-center leading-tight ${paso.inactivo ? 'text-[#A9B0BC]' : 'text-[#5C2472]'}`}
            aria-hidden="true"
        >
            {paso.signo || ''}
        </span>
        <span className={`leading-tight ${paso.inactivo ? 'text-[#A9B0BC]' : ''}`}>
            <span className={paso.inactivo ? '' : 'text-[#2E4372] font-medium'}>{paso.concepto}</span>
            {paso.detalle && <span className={paso.inactivo ? '' : 'text-[#465055]'}> {paso.detalle}</span>}
            {paso.delContexto && !paso.inactivo && <span className="text-[#FF8300]"> · del visor</span>}
        </span>
        <span className={`text-right tabular-nums leading-tight ${paso.inactivo ? 'text-[#A9B0BC]' : 'text-[#465055]'}`}>
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

            <div className="flex items-center gap-1.5 mt-2 rounded-lg bg-[#EFF3FC] px-2 py-1.5">
                <span className="text-[15px] font-bold text-[#5C2472] leading-none w-[16px] text-center" aria-hidden="true">=</span>
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
