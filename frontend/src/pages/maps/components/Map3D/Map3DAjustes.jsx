import Icon from '@components/Icon';
import PanelHeader from '@components/PanelHeader';
import PillCloseButton from '@components/PillCloseButton';
import Switch from '@components/Switch';
import { useView3d } from '@contexts/View3dContext';
import Map3DPopover from './Map3DPopover';
import Map3DDeslizador from './Map3DDeslizador';
import { deslizadores3d } from './deslizadores3d';

const Interruptor = ({ titulo, activo, onChange }) => (
    <div className="flex items-center justify-between font-garet text-[12px] text-graphite">
        <span>{titulo}</span>
        <Switch checked={activo} onChange={onChange} />
    </div>
);

const Map3DAjustes = ({ anchorRef, onClose }) => {
    const view3d = useView3d();
    const deslizadores = deslizadores3d(view3d);

    return (
        <Map3DPopover
            anchorRef={anchorRef}
            onClose={onClose}
            width={280}
            alinear="abajo"
            etiqueta="Ajustes de la vista 3D"
            className="rounded-[12px] bg-[#F9FBFF] px-4.5 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A]"
        >
            <PanelHeader
                icono={<Icon name="settings" className="size-4.5 shrink-0" />}
                titulo="Ajustes 3D"
                acciones={<PillCloseButton onClick={onClose} size="sm" reveal="siempre" tooltip="Cerrar ajustes" ariaLabel="Cerrar ajustes de la vista 3D" />}
            />
            <div className="flex flex-col gap-3 rounded-[7px] bg-white p-3">
                {Object.entries(deslizadores).map(([clave, deslizador]) => (
                    <Map3DDeslizador key={clave} {...deslizador} />
                ))}
            </div>
            <div className="flex flex-col gap-2.5 rounded-[7px] bg-white p-3">
                <Interruptor titulo="Terreno" activo={view3d.terreno} onChange={view3d.setTerreno} />
                <Interruptor titulo="Cielo" activo={view3d.cielo} onChange={view3d.setCielo} />
                <Interruptor titulo="Niebla" activo={view3d.niebla} onChange={view3d.setNiebla} />
            </div>
            <button
                type="button"
                onClick={view3d.restablecer}
                className="self-center h-8 px-4 rounded-full border border-transparent bg-[#EAEFFA] font-garet font-bold text-[13px] text-purple-deep hover:border-purple transition-colors cursor-pointer"
            >
                Restablecer
            </button>
        </Map3DPopover>
    );
};

export default Map3DAjustes;
