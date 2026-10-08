import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const VARIANTES = {
    pill: {
        contenedor: 'inline-flex items-center gap-0.5 rounded-full bg-white p-0.5 shrink-0 shadow-[0px_1px_3px_#00000014]',
        boton: (compact, conIcono) => `${conIcono ? 'px-2 py-1' : (compact ? 'px-2 py-[3px] text-[9px]' : 'px-2.5 py-0.5 text-[11px]')} rounded-full`,
        activo: 'bg-[#E9EDF7] text-[#70308A]',
        inactivo: 'text-[#9AA7B8] hover:text-[#70308A]',
        apagado: '',
        disparador: '',
    },
    gris: {
        contenedor: 'inline-flex items-center gap-0.5 rounded-full bg-[#E3E7ED] p-0.5 shrink-0',
        boton: (compact, conIcono) => `${conIcono ? 'px-2 py-1' : (compact ? 'px-2 py-[3px] text-[9px]' : 'px-2.5 py-0.5 text-[11px]')} rounded-full`,
        activo: 'bg-white text-[#70308A] shadow-[0px_1px_3px_#00000029]',
        inactivo: 'text-[#7D8896] hover:text-[#70308A]',
        apagado: '',
        disparador: '',
    },
    panel: {
        contenedor: 'flex w-full gap-1 p-1 bg-[#EAEFFA] rounded-lg',
        boton: () => 'flex-1 w-full py-1.5 rounded-md text-[12px]/[16px]',
        activo: 'bg-white text-purple shadow-sm',
        inactivo: 'text-[#6E7477] hover:text-purple',
        apagado: 'text-[#B5BAC2]',
        disparador: 'flex-1 min-w-0',
    },
};

const Segmented = ({ options, value, onChange, disabled = false, compact = false, variant = 'pill', className = '', ariaLabel }) => {
    const estilo = VARIANTES[variant] || VARIANTES.pill;

    const handleClick = (e, option) => {
        e.stopPropagation();
        if (disabled || option.disabled || option.value === value) return;
        onChange?.(option.value);
    };

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={`
                ${estilo.contenedor}
                ${disabled ? 'opacity-50' : ''}
                ${className}
            `}
        >
            {options.map(option => {
                const isSelected = option.value === value;
                const apagado = disabled || option.disabled;
                const button = (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-disabled={apagado || undefined}
                        disabled={disabled}
                        onClick={(e) => handleClick(e, option)}
                        className={`
                            ${estilo.boton(compact, Boolean(option.icon))} font-garet font-bold
                            inline-flex items-center justify-center
                            transition-colors duration-200 ease-in-out select-none
                            ${isSelected ? estilo.activo : (option.disabled && estilo.apagado ? estilo.apagado : estilo.inactivo)}
                            ${apagado ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {option.icon
                            ? <Icon name={option.icon} className="size-3.5" />
                            : option.label}
                    </button>
                );

                return option.tooltip
                    ? <Tooltip key={option.value} content={option.tooltip} triggerClassName={estilo.disparador}>{button}</Tooltip>
                    : button;
            })}
        </div>
    );
};

export default Segmented;
