import Icon from '@components/Icon';
import PanelHeader from '@components/PanelHeader';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import Tooltip from '@components/Tooltip';
import Switch from '@components/Switch';
import Segmented from '@components/Segmented';
import { useView3d } from '@contexts/View3dContext';
import Map3DPopover from './Map3DPopover';
import Map3DDeslizador from './Map3DDeslizador';
import { deslizadores3d } from './deslizadores3d';

const IconoRestablecer = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <polyline points="3 3 3 9 9 9" />
    </svg>
);

const OPCIONES_PUNTOS = [
    { value: 'sombra', label: 'Sombra' },
    { value: 'poste', label: 'Poste' },
    { value: 'frente', label: 'Frente' },
];

const OPCIONES_TEXTOS = [
    { value: 'frente', label: 'De frente' },
    { value: 'planos', label: 'Planos' },
];

const DESLIZADORES = ['escala', 'altura', 'orbita'];

const Interruptor = ({ titulo, activo, onChange }) => (
    <div className="flex items-center justify-between font-garet text-[12px] text-graphite">
        <span>{titulo}</span>
        <Switch checked={activo} onChange={onChange} />
    </div>
);

const Selector = ({ titulo, opciones, valor, onChange, etiqueta }) => (
    <div className="flex flex-col gap-2">
        <span className="font-garet text-[12px] text-graphite">{titulo}</span>
        <Segmented variant="panel" options={opciones} value={valor} onChange={onChange} ariaLabel={etiqueta} />
    </div>
);

const Map3DAjustes = ({ anchorRef, onClose }) => {
    const view3d = useView3d();
    const deslizadores = deslizadores3d(view3d);
    const cambiar = clave => valor => view3d.setAjuste(clave, valor);

    return (
        <Map3DPopover
            anchorRef={anchorRef}
            onClose={onClose}
            width={280}
            alinear="abajo"
            etiqueta="Ajustes de la vista 3D"
            className="max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[12px] bg-[#F9FBFF] px-4.5 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A]"
        >
            <PanelHeader
                icono={<Icon name="settings" className="size-4.5 shrink-0" />}
                titulo="Ajustes 3D"
                acciones={(
                    <>
                        <Tooltip content="Restablecer los ajustes de fábrica">
                            <button
                                type="button"
                                onClick={view3d.restablecer}
                                className="flex items-center justify-center size-6 text-gray-500 hover:text-gray-800 cursor-pointer"
                                aria-label="Restablecer los ajustes de la vista 3D"
                            >
                                <IconoRestablecer />
                            </button>
                        </Tooltip>
                        <MobileSheetCloseButton onClick={onClose} />
                    </>
                )}
            />
            <div className="flex flex-col gap-3 rounded-[7px] bg-white p-3">
                <Selector titulo="Puntos" opciones={OPCIONES_PUNTOS} valor={view3d.estiloPuntos} onChange={view3d.setEstiloPuntos} etiqueta="Cómo se dibujan los puntos en 3D" />
                <Selector titulo="Textos" opciones={OPCIONES_TEXTOS} valor={view3d.estiloTextos} onChange={cambiar('estiloTextos')} etiqueta="Cómo se dibujan los textos en 3D" />
            </div>
            <div className="flex flex-col gap-3 rounded-[7px] bg-white p-3">
                {DESLIZADORES.map(clave => <Map3DDeslizador key={clave} {...deslizadores[clave]} />)}
            </div>
            <div className="flex flex-col gap-2.5 rounded-[7px] bg-white p-3">
                <Interruptor titulo="Agrupar puntos cercanos" activo={view3d.agruparPuntos} onChange={cambiar('agruparPuntos')} />
                <Interruptor titulo="Terreno" activo={view3d.terreno} onChange={view3d.setTerreno} />
                <Interruptor titulo="Cielo" activo={view3d.cielo} onChange={view3d.setCielo} />
                <Interruptor titulo="Niebla" activo={view3d.niebla} onChange={view3d.setNiebla} />
                <Interruptor titulo="Contorno del estado" activo={view3d.contorno} onChange={cambiar('contorno')} />
            </div>
        </Map3DPopover>
    );
};

export default Map3DAjustes;
