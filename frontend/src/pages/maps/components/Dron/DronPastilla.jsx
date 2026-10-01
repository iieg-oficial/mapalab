import { useEffect, useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';
import { RADIUS_ICON } from '@pages/maps/helpers/periodicityTones';
import Map3DRing from '../Map3D/Map3DRing';
import DronIcono from './DronIcono';
import DronMenuAeronave from './DronMenuAeronave';
import DronTeclas from './DronTeclas';
import DronGrabar from './DronGrabar';

const BOTON = `flex items-center justify-center size-7.5 ${RADIUS_ICON} shrink-0 cursor-pointer transition-colors`;
const tono = activo => (activo ? 'bg-[#5C2472] text-white' : 'bg-[#F0E6F6] text-[#5C2472] hover:bg-[#E2D3EA]');

const DronPastilla = () => {
    const { config, perfil, setOpcion, alternar, salir } = useDron();
    const { isMobile } = useSider();
    const [abierto, setAbierto] = useState(null);
    useEffect(() => {
        if (isMobile) return undefined;
        const espera = setTimeout(() => setAbierto(previo => previo ?? 'teclas'), 650);
        return () => clearTimeout(espera);
    }, [isMobile]);
    const barraRef = useRef(null);
    const alternarPanel = cual => setAbierto(previo => (previo === cual ? null : cual));
    const cerrar = () => setAbierto(null);
    const kmh = perfil.vel[config.velocidad];

    return (
        <div ref={barraRef} className="grid grid-rows-6 place-items-center h-full min-h-[232px] w-11 rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A]">
            <Tooltip content={`Velocidad ${config.velocidad + 1}: ${kmh} km/h · teclas 1, 2 y 3`}>
                <Map3DRing
                    label={`Velocidad ${config.velocidad + 1} de 3`}
                    texto={String(config.velocidad + 1)}
                    porcentaje={((config.velocidad + 1) / 3) * 100}
                    tono="#5C2472"
                    abierto={false}
                    onToggle={() => setOpcion('velocidad', (config.velocidad + 1) % 3)}
                />
            </Tooltip>
            <Tooltip content={config.seguir ? 'Sigue el relieve: mantiene la altura sobre el terreno' : 'Altura fija sobre el nivel del mar'}>
                <button
                    type="button"
                    className={`${BOTON} ${tono(config.seguir)}`}
                    onClick={() => alternar('seguir')}
                    aria-pressed={config.seguir}
                    aria-label="Seguir el relieve"
                >
                    <DronIcono nombre="relieve" className="size-4.5" />
                </button>
            </Tooltip>
            <Tooltip content={`Aeronave: ${perfil.nombre}`}>
                <button
                    type="button"
                    className={`${BOTON} ${tono(abierto === 'aeronave')}`}
                    onClick={() => alternarPanel('aeronave')}
                    aria-haspopup="dialog"
                    aria-expanded={abierto === 'aeronave'}
                    aria-label={`Cambiar aeronave, ahora ${perfil.nombre}`}
                >
                    <DronIcono nombre={config.modelo} className="size-5" />
                </button>
            </Tooltip>
            <Tooltip content="Teclas del modo dron">
                <button
                    type="button"
                    className={`${BOTON} ${tono(abierto === 'teclas')}`}
                    onClick={() => alternarPanel('teclas')}
                    aria-haspopup="dialog"
                    aria-expanded={abierto === 'teclas'}
                    aria-label="Teclas del modo dron"
                >
                    <DronIcono nombre="teclas" className="size-5" />
                </button>
            </Tooltip>
            <DronGrabar anchorRef={barraRef} abierto={abierto === 'grabar'} onAlternar={() => alternarPanel('grabar')} onCerrar={cerrar} />
            <PillCloseButton
                onClick={salir}
                size="pastilla"
                reveal="siempre"
                tooltip="Al dar clic sales del modo dron"
                ariaLabel="Salir del modo dron"
            />
            {abierto === 'aeronave' && <DronMenuAeronave anchorRef={barraRef} bordeRef={barraRef} onClose={cerrar} />}
            {abierto === 'teclas' && <DronTeclas anchorRef={barraRef} bordeRef={barraRef} onClose={cerrar} />}
        </div>
    );
};

export default DronPastilla;
