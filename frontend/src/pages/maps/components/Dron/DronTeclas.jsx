import PanelHeader from '@components/PanelHeader';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { useDron } from '@contexts/DronContext';
import { mandosDe } from '@pages/maps/helpers/dron/aeronaves';
import Map3DPopover from '../Map3D/Map3DPopover';
import DronIcono from './DronIcono';

const avanceDe = (mandos) => {
    if (!mandos.avance) return null;
    return mandos.reversa ? 'Adelante y atrás' : 'Acelerar y frenar';
};

const LATERAL = { desplaza: 'Desplazarse', gira: 'Ladearse para girar', null: null };

const teclasDe = (mandos, globo) => [
    [['W', 'S'], avanceDe(mandos)],
    [['A', 'D'], LATERAL[mandos.lateral]],
    [['Q', 'E', '←', '→'], globo ? 'Girar la canasta' : 'Girar'],
    [['R', 'F', '↑', '↓'], globo ? 'Quemador y válvula' : 'Subir y bajar'],
    [['T', 'G'], 'Inclinar la cámara'],
    [['1', '2', '3'], 'Velocidad'],
    [['V'], '1ª o 3ª persona'],
    [['P'], 'Piloto automático'],
    [['H'], 'Nivelar'],
    [['Esc'], 'Salir del dron'],
];

const DronTeclas = ({ anchorRef, bordeRef, onClose }) => {
    const { config, perfil } = useDron();
    const filas = teclasDe(mandosDe(config.modelo), perfil.tipo === 'globo');

    return (
        <Map3DPopover
            anchorRef={anchorRef}
            bordeRef={bordeRef}
            onClose={onClose}
            width={252}
            alinear="abajo"
            etiqueta="Teclas del modo dron"
            className="rounded-[12px] bg-[#F9FBFF] px-4.5 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A]"
        >
            <PanelHeader
                icono={<DronIcono nombre="teclas" className="size-4.5" />}
                titulo={`Teclas · ${perfil.nombre}`}
                acciones={<MobileSheetCloseButton onClick={onClose} />}
            />
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.5 rounded-[7px] bg-white p-3 font-garet text-[11.5px] text-[#6A6180]">
                {filas.map(([teclas, accion]) => (
                    <div key={teclas.join('')} className={`contents ${accion ? '' : '[&>*]:opacity-40'}`}>
                        <dt className="flex gap-0.5">
                            {teclas.map(tecla => (
                                <kbd key={tecla} className={`min-w-4 rounded-[5px] bg-[#F0E6F6] px-1 text-center font-garet text-[10px] font-bold text-[#5C2472] ${accion ? '' : 'line-through'}`}>{tecla}</kbd>
                            ))}
                        </dt>
                        <dd>{accion || `No aplica en ${perfil.nombre.toLowerCase()}`}</dd>
                    </div>
                ))}
            </dl>
        </Map3DPopover>
    );
};

export default DronTeclas;
