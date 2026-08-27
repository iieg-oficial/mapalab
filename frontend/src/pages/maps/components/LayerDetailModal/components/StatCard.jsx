import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import StatReceta from './StatReceta';

const SIZES = {
    default: { box: 'p-3.5', value: 'text-[16px]/[30px]', simbolo: 'text-[12px]', label: 'text-[13px]/[16px]' },
    compact: { box: 'p-2', value: 'text-[11px]/[16px]', simbolo: 'text-[9px]', label: 'text-[9px]/[11px]' },
};

const RETARDO_MS = 2000;

const StatCard = ({ label, value, simbolo, className = '', size = 'default', receta = null }) => {
    const s = SIZES[size] || SIZES.default;
    const Contenedor = receta ? 'button' : 'div';
    const [abierta, setAbierta] = useState(false);
    const [fijada, setFijada] = useState(false);
    const temporizador = useRef(null);

    useEffect(() => () => clearTimeout(temporizador.current), []);

    const programar = () => {
        if (!receta) return;
        clearTimeout(temporizador.current);
        temporizador.current = setTimeout(() => setAbierta(true), RETARDO_MS);
    };

    const cancelar = () => {
        clearTimeout(temporizador.current);
        if (!fijada) setAbierta(false);
    };

    const alternar = () => {
        clearTimeout(temporizador.current);
        setFijada(v => !v);
        setAbierta(v => !(v && fijada));
    };

    return (
        <div
            className="relative"
            onMouseEnter={programar}
            onMouseLeave={cancelar}
            onFocus={programar}
            onBlur={cancelar}
        >
            <Contenedor
                className={`bg-[#EFF3FC] rounded-[14px] ${s.box} min-h-auto flex flex-col justify-center w-full ${receta ? 'cursor-pointer' : ''} ${className}`}
                {...(receta ? { type: 'button', onClick: alternar, 'aria-expanded': abierta } : {})}
            >
                <div className="flex flex-col items-center justify-center text-center w-full">
                    <p className={`${s.value} font-garet font-bold text-purple`}>
                        {formatNumber(value)}{simbolo && <span className={`${s.simbolo} font-medium ml-1`}>{simbolo}</span>}
                    </p>
                    <p className={`${s.label} font-garet font-medium text-[#465055] tracking-normal`}>
                        {label}
                    </p>
                </div>
            </Contenedor>

            {abierta && receta && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 font-garet" role="tooltip">
                    <StatReceta receta={receta} valor={formatNumber(value)} simbolo={simbolo} />
                </div>
            )}
        </div>
    );
};

export default StatCard;
