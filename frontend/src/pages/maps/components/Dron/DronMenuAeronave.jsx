import PanelHeader from '@components/PanelHeader';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { useDron } from '@contexts/DronContext';
import { AERONAVES, MODELOS_DRON } from '@pages/maps/helpers/dron/aeronaves';
import Map3DPopover from '../Map3D/Map3DPopover';
import DronIcono from './DronIcono';

const DronMenuAeronave = ({ anchorRef, bordeRef, onClose }) => {
    const { config, setOpcion } = useDron();
    const elegir = (modelo) => {
        setOpcion('modelo', modelo);
        onClose();
    };

    return (
        <Map3DPopover
            anchorRef={anchorRef}
            bordeRef={bordeRef}
            onClose={onClose}
            width={292}
            alinear="abajo"
            etiqueta="Elegir aeronave"
            className="rounded-[12px] bg-[#F9FBFF] px-3 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A]"
        >
            <PanelHeader
                icono={<DronIcono nombre={config.modelo} className="size-4.5" />}
                titulo="Aeronave"
                acciones={<MobileSheetCloseButton onClick={onClose} />}
            />
            <div role="radiogroup" aria-label="Aeronave" className="grid grid-cols-2 gap-1 rounded-[7px] bg-white p-2">
                {MODELOS_DRON.map((modelo) => {
                    const { nombre, vel } = AERONAVES[modelo];
                    const activo = modelo === config.modelo;
                    return (
                        <button
                            key={modelo}
                            type="button"
                            role="radio"
                            aria-checked={activo}
                            onClick={() => elegir(modelo)}
                            title={`${nombre}: ${vel.join(' · ')} km/h`}
                            className={`flex items-center gap-2 rounded-[10px] border px-2 py-1.5 text-left font-garet text-[11.5px] font-semibold leading-tight cursor-pointer transition-colors ${activo ? 'border-[#5C247259] bg-[#F0E6F6] text-[#5C2472]' : 'border-transparent text-graphite hover:bg-[#F0E6F6]'}`}
                        >
                            <DronIcono nombre={modelo} className={`size-5.5 ${activo ? 'text-[#5C2472]' : 'text-[#6A6180]'}`} />
                            <span>{nombre}</span>
                        </button>
                    );
                })}
            </div>
        </Map3DPopover>
    );
};

export default DronMenuAeronave;
