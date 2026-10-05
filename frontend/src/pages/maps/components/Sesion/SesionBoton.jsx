import { useCallback, useEffect, useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import { useSesion } from '@contexts/SesionContext';
import { IconoPersona } from './SesionIconos';
import { iniciales } from '@pages/maps/helpers/sesion/iniciales';
import SesionPopover from './SesionPopover';

const BASE = 'relative rounded-full flex items-center justify-center shadow-[0_5px_20px_#1A26641A] cursor-pointer';

const SesionBoton = ({ sizeClass = 'size-5', placement = 'right-start' }) => {
    const sesion = useSesion();
    const [abierto, setAbierto] = useState(false);
    const anchorRef = useRef(null);
    const cerrar = useCallback(() => setAbierto(false), []);

    useEffect(() => {
        if (sesion.error) setAbierto(true);
    }, [sesion.error]);

    if (!sesion.habilitada) return null;

    const { usuario, entrando } = sesion;
    const etiqueta = usuario ? `Cuenta: ${usuario.nombre}` : 'Iniciar sesión';
    const alternar = (e) => {
        e.stopPropagation();
        if (abierto) sesion.limpiarError();
        setAbierto((v) => !v);
    };

    return (
        <>
            <Tooltip content={abierto ? '' : etiqueta} placement="right" delay={300} variant="soft">
                <button
                    ref={anchorRef}
                    type="button"
                    onClick={alternar}
                    aria-label={etiqueta}
                    aria-expanded={abierto}
                    className={[BASE, sizeClass, usuario ? 'bg-purple text-white' : 'bg-white text-[#7c8bad] hover:text-purple'].join(' ')}
                >
                    {usuario
                        ? <span className="font-garet text-[8px] font-bold leading-none">{iniciales(usuario.nombre)}</span>
                        : <IconoPersona className="size-3" />}
                    {usuario && <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-[#2BB673] ring-2 ring-white" />}
                    {entrando && <span className="absolute -inset-0.5 rounded-full border-2 border-purple border-t-transparent animate-spin" />}
                </button>
            </Tooltip>
            <SesionPopover open={abierto} anchorRef={anchorRef} placement={placement} sesion={sesion} onClose={cerrar} />
        </>
    );
};

export default SesionBoton;
