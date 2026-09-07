import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const REVELADOS = {
    overlay: [
        'transition-[opacity,visibility] duration-150',
        'md:invisible md:opacity-0 md:delay-500',
        'md:group-hover:visible md:group-hover:opacity-100 md:group-hover:delay-0',
        'md:group-focus-within:visible md:group-focus-within:opacity-100 md:group-focus-within:delay-0',
    ].join(' '),
    inline: [
        'overflow-hidden transition-[max-width,opacity] duration-150',
        'md:max-w-0 md:opacity-0 md:delay-500',
        'md:group-hover:max-w-8 md:group-hover:opacity-100 md:group-hover:delay-0',
        'md:group-focus-within:max-w-8 md:group-focus-within:opacity-100 md:group-focus-within:delay-0',
    ].join(' '),
};

const TAMANOS = {
    sm: { boton: 'size-6', icono: 'size-4.5' },
    md: { boton: 'size-10', icono: 'size-7' },
};

const PillCloseButton = ({
    onClick,
    tooltip,
    ariaLabel,
    size = 'md',
    placement = 'right',
    reveal = 'overlay',
    className = '',
}) => {
    const [encima, setEncima] = useState(false);
    const medidas = TAMANOS[size] || TAMANOS.md;
    const revelado = REVELADOS[reveal] || REVELADOS.overlay;

    const boton = (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setEncima(true)}
            onMouseLeave={() => setEncima(false)}
            className={[
                medidas.boton,
                reveal === 'inline' ? 'ml-1' : '',
                'flex items-center justify-center rounded-full border transition-all cursor-pointer shrink-0',
                encima ? 'bg-[#FF577D] border-[#FF577D]' : 'bg-[#FFE6EC] border-[#FFE6EC] hover:border-[#FF577D]',
            ].join(' ')}
            aria-label={ariaLabel}
        >
            <Icon name="cerrar" state={encima ? 'hover' : 'normal'} className={medidas.icono} />
        </button>
    );

    if (!tooltip) {
        return <span className={`${revelado} ${className}`}>{boton}</span>;
    }

    return (
        <Tooltip
            content={tooltip}
            placement={placement}
            delay={300}
            triggerClassName={`${revelado} ${className}`}
        >
            {boton}
        </Tooltip>
    );
};

export default PillCloseButton;
