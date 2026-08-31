import { createPortal } from 'react-dom';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';

const TAMANOS = {
    normal: {
        pill: 'h-10 pl-3 pr-4',
        gap: 'gap-2',
        icono: 'size-5',
        texto: 'text-[13px]/[16px] max-w-70',
    },
    compacta: {
        pill: 'h-7 pl-2.5 pr-3',
        gap: 'gap-1.5',
        icono: 'size-3.5',
        texto: 'text-[12px]/[15px] max-w-44',
    },
};

const PillMinimizada = ({
    etiqueta,
    icono = 'numeralia',
    sufijo = null,
    activa = false,
    tamano = 'normal',
    tooltipAbrir,
    tooltipCerrar,
    ariaAbrir,
    ariaCerrar,
    onAbrir,
    onCerrar,
    anillo = '',
    pillRef,
}) => {
    const medida = TAMANOS[tamano] || TAMANOS.normal;
    const dock = typeof document === 'undefined' ? null : document.getElementById('dock-pills');

    const chrome = `rounded-full bg-white shadow-[0_5px_20px_#1A26641A] border transition-all ${activa ? 'border-purple' : 'border-[#EAEFFA] hover:border-purple'} ${anillo}`;

    const pill = (
        <div ref={pillRef} className="group relative flex min-w-0 pointer-events-auto">
            <Tooltip content={tooltipAbrir} placement="top" delay={300}>
                <button
                    type="button"
                    onClick={onAbrir}
                    aria-pressed={activa}
                    aria-label={ariaAbrir}
                    className={`
                        ${medida.pill} ${medida.gap} max-w-full flex items-center cursor-pointer ${chrome}
                    `}
                >
                    <Icon name={icono} className={`${medida.icono} shrink-0 text-purple`} />
                    <span className={`${medida.texto} font-garet font-bold text-purple tracking-normal whitespace-nowrap truncate`}>
                        {etiqueta}
                    </span>
                    {sufijo !== null && (
                        <span className="text-[11px]/[14px] font-garet text-[#8894AE] tabular-nums shrink-0">
                            {sufijo}
                        </span>
                    )}
                </button>
            </Tooltip>

            {onCerrar && (
                <PillCloseButton
                    onClick={onCerrar}
                    tooltip={tooltipCerrar}
                    ariaLabel={ariaCerrar}
                    size={tamano === 'compacta' ? 'sm' : 'md'}
                    className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2"
                />
            )}
        </div>
    );

    return dock ? createPortal(pill, dock) : pill;
};

export default PillMinimizada;
