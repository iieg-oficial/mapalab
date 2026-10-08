import Tooltip from '@components/Tooltip';

const BASE = 'flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0';
const TAMANOS = { sm: 'size-6', md: 'size-7', lg: 'size-8' };

const ESTADOS = {
    activo: 'text-orange bg-orange/15 hover:bg-orange/25',
    normal: 'text-purple hover:text-orange hover:bg-orange/15',
    apagado: 'text-[#6E7477] hover:text-purple hover:bg-purple-soft',
};

const ActionIconButton = ({
    onClick,
    activo = false,
    apagado = false,
    deshabilitado = false,
    titulo,
    etiqueta,
    tamano = 'md',
    className = '',
    children,
    ...props
}) => {
    const estado = (apagado || deshabilitado) ? 'apagado' : (activo ? 'activo' : 'normal');

    const boton = (
        <button
            type="button"
            onClick={onClick}
            disabled={deshabilitado}
            aria-pressed={activo}
            aria-label={etiqueta || titulo}
            className={`${BASE} ${TAMANOS[tamano] || TAMANOS.md} ${ESTADOS[estado]} ${deshabilitado ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );

    return titulo ? <Tooltip content={titulo}>{boton}</Tooltip> : boton;
};

export default ActionIconButton;
