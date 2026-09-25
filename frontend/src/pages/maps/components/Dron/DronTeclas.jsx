import PanelHeader from '@components/PanelHeader';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import Map3DPopover from '../Map3D/Map3DPopover';
import DronIcono from './DronIcono';

const TECLAS = [
    [['W', 'A', 'S', 'D'], 'Mover'],
    [['Q', 'E'], 'Girar'],
    [['R', 'F'], 'Subir y bajar'],
    [['↑', '↓'], 'Cámara'],
    [['1', '2', '3'], 'Velocidad'],
    [['V'], '1ª o 3ª persona'],
    [['P'], 'Piloto automático'],
    [['H'], 'Nivelar'],
    [['Esc'], 'Salir del dron'],
];

const DronTeclas = ({ anchorRef, bordeRef, onClose }) => (
    <Map3DPopover
        anchorRef={anchorRef}
        bordeRef={bordeRef}
        onClose={onClose}
        width={220}
        alinear="abajo"
        etiqueta="Teclas del modo dron"
        className="rounded-[12px] bg-[#F9FBFF] px-3 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A]"
    >
        <PanelHeader
            icono={<DronIcono nombre="teclas" className="size-4.5" />}
            titulo="Teclas"
            acciones={<MobileSheetCloseButton onClick={onClose} />}
        />
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.5 rounded-[7px] bg-white p-3 font-garet text-[11.5px] text-[#6A6180]">
            {TECLAS.map(([teclas, accion]) => (
                <div key={accion} className="contents">
                    <dt className="flex gap-0.5">
                        {teclas.map(tecla => (
                            <kbd key={tecla} className="min-w-4 rounded-[5px] bg-[#F0E6F6] px-1 text-center font-garet text-[10px] font-bold text-[#5C2472]">{tecla}</kbd>
                        ))}
                    </dt>
                    <dd>{accion}</dd>
                </div>
            ))}
        </dl>
    </Map3DPopover>
);

export default DronTeclas;
