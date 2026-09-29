import Icon from '@components/Icon';
import PanelHeader from '@components/PanelHeader';
import Tooltip from '@components/Tooltip';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { useView3d } from '@contexts/View3dContext';
import Segmented from '@components/Segmented';
import {
    INTENSIDADES, INTENSIDAD_DEFAULT, deslizadorDeNivel, nivelDeDeslizador, textoNivel,
} from '@pages/maps/helpers/inundacion';
import Map3DPopover from './Map3DPopover';
import Map3DDeslizador from './Map3DDeslizador';

const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

export const IconoGota = ({ className = 'size-4.5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
        <path d="M12 3c3.5 4.2 6 7.6 6 10.5a6 6 0 01-12 0C6 10.6 8.5 7.2 12 3z" />
        <path d="M9.5 14.5a2.5 2.5 0 002.5 2.5" />
    </svg>
);

const SIN_AGUA = { nivel: 0, lloviendo: false, referencia: null, centro: null };
const OPCIONES = Object.entries(INTENSIDADES).map(([value, { nombre, detalle }]) => ({ value, label: nombre, tooltip: detalle }));

const Map3DInundacion = ({ anchorRef, bordeRef, onClose }) => {
    const { inundacion, setInundacion } = useView3d();
    const { nivel, lloviendo, referencia, intensidad = INTENSIDAD_DEFAULT } = inundacion;
    const msnm = referencia === null ? null : referencia + nivel;
    const { tope } = INTENSIDADES[intensidad];

    return (
        <Map3DPopover
            anchorRef={anchorRef}
            bordeRef={bordeRef}
            onClose={onClose}
            width={320}
            alinear="abajo"
            etiqueta="Simulación de inundación"
            className="rounded-[12px] bg-[#F9FBFF] px-4.5 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A]"
        >
            <PanelHeader
                icono={<span className="text-[#1F6FA8]"><IconoGota /></span>}
                titulo="Lluvia e inundación"
                acciones={<MobileSheetCloseButton onClick={onClose} />}
            />
            <div className="flex flex-col gap-3 rounded-[7px] bg-white p-3">
                <div className="flex flex-col gap-2">
                    <span className="font-garet text-[12px] text-graphite">Intensidad de la lluvia</span>
                    <Segmented
                        variant="panel"
                        options={OPCIONES}
                        value={intensidad}
                        onChange={valor => setInundacion({ intensidad: valor })}
                        ariaLabel="Intensidad de la lluvia"
                    />
                </div>
                <Map3DDeslizador
                    titulo="Nivel del agua"
                    valor={deslizadorDeNivel(nivel)}
                    texto={msnm === null ? `+${textoNivel(nivel)} m` : `+${textoNivel(nivel)} m · ${formato.format(msnm)} msnm`}
                    min={0}
                    max={100}
                    step={1}
                    onChange={valor => setInundacion({ nivel: nivelDeDeslizador(valor), lloviendo: false })}
                />
                <p className="font-garet text-[11px] leading-snug text-[#6A6180]">
                    El agua sube desde lo más bajo que se ve en pantalla.
                </p>
                <div className="flex items-center gap-2">
                    <Tooltip content={lloviendo ? 'Detener la lluvia' : `Hacer llover hasta +${textoNivel(tope)} m`}>
                        <button
                            type="button"
                            onClick={() => setInundacion({ lloviendo: !lloviendo })}
                            disabled={!lloviendo && nivel >= tope}
                            aria-pressed={lloviendo}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-garet text-[12px] font-bold cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${lloviendo ? 'bg-[#1F6FA8] text-white' : 'bg-[#E4F0FA] text-[#1F6FA8] hover:bg-[#D2E6F6]'}`}
                        >
                            <Icon name={lloviendo ? 'pause' : 'play'} className="size-3 shrink-0" />
                            {lloviendo ? 'Lloviendo' : 'Llover'}
                        </button>
                    </Tooltip>
                    <Tooltip content="Quitar el agua">
                        <button
                            type="button"
                            onClick={() => setInundacion(SIN_AGUA)}
                            disabled={nivel === 0 && !lloviendo}
                            className="rounded-full bg-[#F0E6F6] px-3 py-1.5 font-garet text-[12px] font-bold text-[#5C2472] cursor-pointer hover:bg-[#E2D3EA] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Secar
                        </button>
                    </Tooltip>
                </div>
            </div>
        </Map3DPopover>
    );
};

export default Map3DInundacion;
