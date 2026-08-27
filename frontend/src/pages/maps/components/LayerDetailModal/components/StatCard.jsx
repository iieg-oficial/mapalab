import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import StatReceta from './StatReceta';

const SIZES = {
    default: { box: 'p-3.5', value: 'text-[16px]/[30px]', simbolo: 'text-[12px]', label: 'text-[13px]/[16px]' },
    compact: { box: 'p-2', value: 'text-[11px]/[16px]', simbolo: 'text-[9px]', label: 'text-[9px]/[11px]' },
};

const RETARDO_MS = 2000;
const ANCHO_FICHA = 270;
const SEPARACION = 6;

const StatCard = ({ label, value, simbolo, className = '', size = 'default', receta = null }) => {
    const s = SIZES[size] || SIZES.default;
    const Contenedor = receta ? 'button' : 'div';
    const [posicion, setPosicion] = useState(null);
    const [fijada, setFijada] = useState(false);
    const temporizador = useRef(null);
    const anclaRef = useRef(null);

    useEffect(() => () => clearTimeout(temporizador.current), []);

    const calcular = () => {
        const rect = anclaRef.current?.getBoundingClientRect();
        if (!rect) return;
        const centro = rect.left + rect.width / 2;
        const izquierda = Math.min(
            Math.max(SEPARACION, centro - ANCHO_FICHA / 2),
            window.innerWidth - ANCHO_FICHA - SEPARACION,
        );
        setPosicion({ izquierda, arriba: rect.top, abajo: rect.bottom, cabeArriba: rect.top > 220 });
    };

    const programar = () => {
        if (!receta) return;
        clearTimeout(temporizador.current);
        temporizador.current = setTimeout(calcular, RETARDO_MS);
    };

    const cancelar = () => {
        clearTimeout(temporizador.current);
        if (!fijada) setPosicion(null);
    };

    const alternar = () => {
        clearTimeout(temporizador.current);
        if (fijada) {
            setFijada(false);
            setPosicion(null);
            return;
        }
        setFijada(true);
        calcular();
    };

    return (
        <div
            ref={anclaRef}
            onMouseEnter={programar}
            onMouseLeave={cancelar}
            onFocus={programar}
            onBlur={cancelar}
        >
            <Contenedor
                className={`bg-[#EFF3FC] rounded-[14px] ${s.box} min-h-auto flex flex-col justify-center w-full ${receta ? 'cursor-pointer' : ''} ${className}`}
                {...(receta ? { type: 'button', onClick: alternar, 'aria-expanded': Boolean(posicion) } : {})}
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

            {posicion && receta && createPortal(
                <div
                    className="fixed z-[60] font-garet"
                    style={posicion.cabeArriba
                        ? { left: posicion.izquierda, bottom: window.innerHeight - posicion.arriba + SEPARACION }
                        : { left: posicion.izquierda, top: posicion.abajo + SEPARACION }}
                    role="tooltip"
                >
                    <StatReceta receta={receta} valor={formatNumber(value)} simbolo={simbolo} />
                </div>,
                document.body,
            )}
        </div>
    );
};

export default StatCard;
