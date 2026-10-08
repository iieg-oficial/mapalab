import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useView3d } from '@contexts/View3dContext';
import { useDron } from '@contexts/DronContext';
import { useCaminar } from '@contexts/CaminarContext';
import { useMapsContext } from '@hooks/useMaps';
import { useIsNonProd } from '@hooks/useDevTools';
import Badge from '@components/Badge';
import DronPastilla from '../Dron/DronPastilla';
import DronIcono from '../Dron/DronIcono';
import CaminarPastilla from '../Caminar/CaminarPastilla';
import Map3DRing from './Map3DRing';
import Map3DSliderPopover from './Map3DSliderPopover';
import Map3DAjustes from './Map3DAjustes';
import Map3DInundacion from './Map3DInundacion';
import { deslizadorDeNivel, textoNivel } from '@pages/maps/helpers/inundacion';
import { deslizadores3d } from './deslizadores3d';

const ANILLOS = ['exag', 'sol'];

const Map3DBar = () => {
    const view3d = useView3d();
    const dron = useDron();
    const caminar = useCaminar();
    const { compareMode } = useMapsContext();
    const conLluvia = useIsNonProd();
    const [abierto, setAbierto] = useState(null);
    const refs = { lluvia: useRef(null), exag: useRef(null), sol: useRef(null), ajustes: useRef(null), barra: useRef(null) };
    if (!view3d.active) return null;
    if (dron.activo) return <DronPastilla />;
    if (caminar.activo) return <CaminarPastilla />;

    const { inundacion } = view3d;
    const conDron = dron.presente && !compareMode?.active;
    const deslizadores = deslizadores3d(view3d);
    const alternar = (cual) => setAbierto(previo => (previo === cual ? null : cual));
    const cerrar = () => setAbierto(null);

    return (
        <div ref={refs.barra} className="flex flex-col items-center w-11 rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A] [&>*]:h-10 [&>*]:flex [&>*]:items-center [&>*]:justify-center">
            {conLluvia && (
                <div className="relative">
                    <Tooltip content={inundacion.nivel > 0 ? `Inundación: +${textoNivel(inundacion.nivel)} m` : 'Simular lluvia e inundación'}>
                        <Map3DRing
                            botonRef={refs.lluvia}
                            label="Lluvia e inundación"
                            texto={inundacion.nivel > 0 ? `${textoNivel(inundacion.nivel)}m` : 'H₂O'}
                            porcentaje={deslizadorDeNivel(inundacion.nivel)}
                            tono="#1F6FA8"
                            abierto={abierto === 'lluvia'}
                            onToggle={() => alternar('lluvia')}
                        />
                    </Tooltip>
                    <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-3 text-[8px] px-1.5 pointer-events-none" />
                </div>
            )}
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
            {conDron && (
                <Tooltip content="Volar como dron">
                    <button
                        type="button"
                        className="relative flex items-center justify-center size-7 rounded-full shrink-0 cursor-pointer text-[#7C8BAD] hover:text-[#5C2472] transition-colors"
                        onClick={() => { cerrar(); dron.entrar(); }}
                        aria-label="Volar como dron"
                    >
                        <DronIcono nombre="cuadri" className="size-6" />
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
                            className="flex items-center justify-center size-7 cursor-pointer text-[#7C8BAD] hover:text-[#5C2472] transition-colors"
                            onClick={() => alternar('ajustes')}
                            aria-expanded={false}
                            aria-label="Ajustes de la vista 3D"
                        >
                            <Icon name="settings" className="size-6 shrink-0" />
                        </button>
                    </Tooltip>
                )}
            </div>
            {ANILLOS.includes(abierto) && (
                <Map3DSliderPopover anchorRef={refs[abierto]} bordeRef={refs.barra} {...deslizadores[abierto]} onClose={cerrar} />
            )}
            {abierto === 'ajustes' && <Map3DAjustes anchorRef={refs.barra} onClose={cerrar} />}
            {conLluvia && abierto === 'lluvia' && <Map3DInundacion anchorRef={refs.barra} bordeRef={refs.barra} onClose={cerrar} />}
        </div>
    );
};

export default Map3DBar;
