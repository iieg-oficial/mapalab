import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useView3d } from '@contexts/View3dContext';
import { useDron } from '@contexts/DronContext';
import Badge from '@components/Badge';
import DronPastilla from '../Dron/DronPastilla';
import DronIcono from '../Dron/DronIcono';
import { RADIUS_ICON } from '@pages/maps/helpers/periodicityTones';
import Map3DRing from './Map3DRing';
import Map3DSliderPopover from './Map3DSliderPopover';
import Map3DAjustes from './Map3DAjustes';
import { deslizadores3d } from './deslizadores3d';

const ANILLOS = ['pitch', 'exag', 'sol'];
const BOTON = `flex items-center justify-center size-8.5 ${RADIUS_ICON} shrink-0 cursor-pointer transition-colors`;
const tonoBoton = (activo) => (activo ? 'bg-[#5C2472] text-white' : 'bg-[#F0E6F6] text-[#5C2472] hover:bg-[#E2D3EA]');

const Map3DBar = () => {
    const view3d = useView3d();
    const dron = useDron();
    const [abierto, setAbierto] = useState(null);
    const refs = { pitch: useRef(null), exag: useRef(null), sol: useRef(null), ajustes: useRef(null), barra: useRef(null) };
    if (!view3d.active) return null;
    if (dron.activo) return <DronPastilla />;

    const { orbita, setOrbita } = view3d;
    const deslizadores = deslizadores3d(view3d);
    const alternar = (cual) => setAbierto(previo => (previo === cual ? null : cual));
    const cerrar = () => setAbierto(null);

    return (
        <div ref={refs.barra} className="flex flex-col items-center justify-evenly h-full w-11 py-1 rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A]">
            {ANILLOS.map((clave) => {
                const { titulo, texto, corto, pct, tono } = deslizadores[clave];
                return (
                    <Tooltip key={clave} content={`${titulo}: ${texto}`}>
                        <Map3DRing
                            botonRef={refs[clave]}
                            label={titulo}
                            texto={corto}
                            porcentaje={pct}
                            tono={tono}
                            abierto={abierto === clave}
                            onToggle={() => alternar(clave)}
                        />
                    </Tooltip>
                );
            })}
            <Tooltip content={orbita ? 'Pausar la órbita' : 'Girar alrededor del centro'}>
                <button
                    type="button"
                    className={`${BOTON} ${tonoBoton(orbita)}`}
                    onClick={() => setOrbita(!orbita)}
                    aria-pressed={orbita}
                    aria-label={orbita ? 'Pausar la órbita' : 'Girar alrededor del centro'}
                >
                    <Icon name={orbita ? 'pause' : 'play'} className="size-3 shrink-0" />
                </button>
            </Tooltip>
            {dron.presente && (
                <Tooltip content="Volar como dron">
                    <button
                        type="button"
                        className={`relative ${BOTON} ${tonoBoton(false)}`}
                        onClick={() => { cerrar(); dron.entrar(); }}
                        aria-label="Volar como dron"
                    >
                        <DronIcono nombre="cuadri" className="size-5" />
                        <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-3 text-[8px] px-1.5 pointer-events-none" />
                    </button>
                </Tooltip>
            )}
            <div ref={refs.ajustes}>
                {abierto === 'ajustes' ? (
                    <PillCloseButton
                        onClick={cerrar}
                        size="pastilla"
                        reveal="siempre"
                        tooltip="Al dar clic se cierran los ajustes"
                        ariaLabel="Cerrar los ajustes de la vista 3D"
                    />
                ) : (
                    <Tooltip content="Ajustes de la vista 3D">
                        <button
                            type="button"
                            className="flex items-center justify-center size-8.5 cursor-pointer text-[#5C2472]"
                            onClick={() => alternar('ajustes')}
                            aria-expanded={false}
                            aria-label="Ajustes de la vista 3D"
                        >
                            <Icon name="settings" className="size-5 shrink-0" />
                        </button>
                    </Tooltip>
                )}
            </div>
            {ANILLOS.includes(abierto) && (
                <Map3DSliderPopover anchorRef={refs[abierto]} bordeRef={refs.barra} {...deslizadores[abierto]} onClose={cerrar} />
            )}
            {abierto === 'ajustes' && <Map3DAjustes anchorRef={refs.barra} onClose={cerrar} />}
        </div>
    );
};

export default Map3DBar;
