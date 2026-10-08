import { useEffect, useState } from 'react';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useCaminar } from '@contexts/CaminarContext';
import CaminarIcono from './CaminarIcono';

const BOTON = 'flex items-center justify-center size-7 rounded-full shrink-0 cursor-pointer transition-colors text-[#7C8BAD] hover:text-[#5C2472]';
const TECLAS = 'W A S D o flechas para caminar · Q E para girar · Shift para correr · arrastra para mirar · V cambia la vista · Esc para salir';

const textoUbicacion = (estado) => {
    if (!estado) return null;
    if (estado.error) return 'No se pudo cargar el edificio';
    if (estado.cargando) return 'Cargando el edificio…';
    return estado.espacio ? `${estado.piso} · ${estado.espacio}` : estado.piso;
};

const CaminarPastilla = () => {
    const { tercera, alternarVista, salir, suscribir } = useCaminar();
    const [estado, setEstado] = useState(null);
    useEffect(() => suscribir(setEstado), [suscribir]);
    const ubicacion = textoUbicacion(estado);
    const vista = tercera ? 'Ver en primera persona' : 'Ver a la persona desde atrás';

    return (
        <>
            <div className="flex flex-col items-center w-11 rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A] [&>*]:h-10 [&>*]:flex [&>*]:items-center [&>*]:justify-center">
                <Tooltip content={vista}>
                    <button type="button" className={BOTON} onClick={alternarVista} aria-label={vista}>
                        <CaminarIcono nombre={tercera ? 'primera' : 'tercera'} />
                    </button>
                </Tooltip>
                <Tooltip content={TECLAS}>
                    <span className={`${BOTON} cursor-help`} role="img" aria-label={TECLAS}>
                        <CaminarIcono nombre="teclas" />
                    </span>
                </Tooltip>
                <div>
                    <PillCloseButton
                        onClick={salir}
                        size="pastilla"
                        reveal="siempre"
                        tooltip="Al dar clic sales del recorrido"
                        ariaLabel="Salir del recorrido del instituto"
                    />
                </div>
            </div>
            {ubicacion && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-white text-sm text-[#2E3A59] shadow-[0_5px_20px_#1A26641A] pointer-events-none" role="status">
                    {ubicacion}
                </div>
            )}
        </>
    );
};

export default CaminarPastilla;
