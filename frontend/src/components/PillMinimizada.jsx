import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const TAMANOS = {
    normal: {
        pill: 'h-10 pl-3 pr-4',
        gap: 'gap-2',
        icono: 'size-5',
        texto: 'text-[13px]/[16px] max-w-70',
        cerrar: 'size-10',
        iconoCerrar: 'size-7',
    },
    compacta: {
        pill: 'h-7 pl-2.5 pr-3',
        gap: 'gap-1.5',
        icono: 'size-3.5',
        texto: 'text-[12px]/[15px] max-w-44',
        cerrar: 'size-7',
        iconoCerrar: 'size-5',
    },
};

const PillMinimizada = ({
    etiqueta,
    cierreDentro = false,
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
    const [cierreEncima, setCierreEncima] = useState(false);
    const medida = TAMANOS[tamano] || TAMANOS.normal;

    const chrome = `rounded-full bg-white shadow-[0_5px_20px_#1A26641A] border transition-all ${activa ? 'border-purple' : 'border-[#EAEFFA] hover:border-purple'} ${anillo}`;

    if (cierreDentro) {
        return (
            <div ref={pillRef} className={`group shrink-0 flex items-center ${medida.pill} ${medida.gap} ${chrome} pointer-events-auto`}>
                <button
                    type="button"
                    onClick={onAbrir}
                    aria-pressed={activa}
                    aria-label={ariaAbrir}
                    title={tooltipAbrir}
                    className={`flex items-center ${medida.gap} min-w-0 cursor-pointer bg-transparent`}
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

                {onCerrar && (
                    <button
                        type="button"
                        onClick={onCerrar}
                        onMouseEnter={() => setCierreEncima(true)}
                        onMouseLeave={() => setCierreEncima(false)}
                        title={tooltipCerrar}
                        aria-label={ariaCerrar}
                        className={`ml-1.5 shrink-0 size-5 flex items-center justify-center rounded-full border cursor-pointer transition-all md:invisible md:opacity-0 md:group-hover:visible md:group-hover:opacity-100 md:group-focus-within:visible md:group-focus-within:opacity-100 ${cierreEncima ? 'bg-[#FF577D] border-[#FF577D]' : 'bg-[#FFE6EC] border-[#FFE6EC]'}`}
                    >
                        <Icon name="cerrar" state={cierreEncima ? 'hover' : 'normal'} className="size-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
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
                <Tooltip
                    content={tooltipCerrar}
                    placement="right"
                    delay={300}
                    triggerClassName="absolute left-full pl-2 top-1/2 -translate-y-1/2 transition-[opacity,visibility] duration-150 md:invisible md:opacity-0 md:delay-500 md:group-hover:visible md:group-hover:opacity-100 md:group-hover:delay-0 md:group-focus-within:visible md:group-focus-within:opacity-100 md:group-focus-within:delay-0"
                >
                    <button
                        type="button"
                        onClick={onCerrar}
                        onMouseEnter={() => setCierreEncima(true)}
                        onMouseLeave={() => setCierreEncima(false)}
                        className={[
                            medida.cerrar,
                            'flex items-center justify-center rounded-full border transition-all cursor-pointer shrink-0',
                            cierreEncima ? 'bg-[#FF577D] border-[#FF577D]' : 'bg-[#FFE6EC] border-[#FFE6EC] hover:border-[#FF577D]',
                        ].join(' ')}
                        aria-label={ariaCerrar}
                    >
                        <Icon name="cerrar" state={cierreEncima ? 'hover' : 'normal'} className={medida.iconoCerrar} />
                    </button>
                </Tooltip>
            )}
        </div>
    );
};

export default PillMinimizada;
