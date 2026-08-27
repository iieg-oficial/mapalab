import { useState } from 'react';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import StatReceta from './StatReceta';

const SIZES = {
    default: { box: 'p-3.5', value: 'text-[16px]/[30px]', simbolo: 'text-[12px]', label: 'text-[13px]/[16px]' },
    compact: { box: 'p-2', value: 'text-[11px]/[16px]', simbolo: 'text-[9px]', label: 'text-[9px]/[11px]' },
};

const StatCard = ({ label, value, simbolo, className = '', size = 'default', receta = null }) => {
    const s = SIZES[size] || SIZES.default;
    const [abierta, setAbierta] = useState(false);

    return (
        <div className="flex flex-col gap-1.5">
            <div className={`bg-[#EFF3FC] rounded-[14px] ${s.box} min-h-auto flex flex-col justify-center ${className}`}>
                <div className="flex flex-col items-center justify-center text-center w-full">
                    <p className={`${s.value} font-garet font-bold text-purple`}>
                        {formatNumber(value)}{simbolo && <span className={`${s.simbolo} font-medium ml-1`}>{simbolo}</span>}
                    </p>
                    <p className={`${s.label} font-garet font-medium text-[#465055] tracking-normal`}>
                        {label}
                    </p>
                    {receta && (
                        <button
                            type="button"
                            onClick={() => setAbierta(v => !v)}
                            aria-expanded={abierta}
                            className="mt-1 text-[9px] font-garet text-purple cursor-pointer hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-purple rounded"
                        >
                            {abierta ? 'ocultar cálculo ▴' : 'cómo se calcula ▾'}
                        </button>
                    )}
                </div>
            </div>
            {abierta && <StatReceta receta={receta} valor={formatNumber(value)} simbolo={simbolo} />}
        </div>
    );
};

export default StatCard;
