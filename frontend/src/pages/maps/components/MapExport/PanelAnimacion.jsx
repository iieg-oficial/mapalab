import { useState } from 'react';
import Segmented from '@components/Segmented';
import { useDron } from '@contexts/DronContext';
import { useView3d } from '@contexts/View3dContext';
import { useGrabarGiro } from '@hooksMaps/useGrabarGiro';
import { useEstadoGiro } from '@hooksMaps/useEstadoGiro';
import PildoraGrabacionGiro from './PildoraGrabacionGiro';
import { useFormatosVideo } from '@hooksMaps/useFormatosVideo';
import { elegible, opcionesDeArchivo } from '@pages/maps/helpers/grabacion/opcionesArchivo';
import AnimacionRuta from './AnimacionRuta';

const ETIQUETA = 'block mb-1 font-garet text-[12px] font-bold text-[#465055]';
const BOTON = 'w-full h-12.5 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px] cursor-pointer';

const DURACIONES = [{ value: 3, label: '3 s' }, { value: 5, label: '5 s' }];
const CALIDADES = [{ value: '720', label: '720p' }, { value: '1080', label: '1080p' }];

const opcionesQue = conDron => [
    { value: 'vuelta', label: 'Vuelta 3D', tooltip: 'Gira la vista 3D una vuelta completa' },
    { value: 'ruta', label: 'Ruta en dron', disabled: !conDron, tooltip: conDron ? 'Vuela una ruta trazada en el minimapa y grábala' : 'Solo en el visor' },
];

const CENTROS = [
    { value: 'actual', label: 'Vista actual', tooltip: 'Gira alrededor del centro de lo que ves' },
    { value: 'punto', label: 'Elegir en el mapa', tooltip: 'Haz clic en el mapa para elegir el centro de la vuelta' },
];

const AnimacionVuelta = ({ titulo, totalCapas, claseEtiqueta, claseBoton, onListo }) => {
    const soporte = useFormatosVideo();
    const opciones = opcionesDeArchivo(soporte, { video: 'Una vuelta completa a la velocidad de la órbita' });
    const [elegido, setTipo] = useState('mp4');
    const tipo = elegible(opciones, elegido);
    const [segundosGif, setSegundosGif] = useState(3);
    const [calidad, setCalidad] = useState('720');
    const [centro, setCentro] = useState('actual');
    const { grabar } = useGrabarGiro();
    const { fase, error } = useEstadoGiro();
    const { active } = useView3d();
    const ocupado = fase !== null;

    const empezar = () => {
        grabar({ tipo, segundosGif, calidad, titulo, totalCapas, centro });
        if (centro === 'punto') onListo?.();
    };

    return (
        <div className="flex flex-col gap-3">
            <div>
                <span className={claseEtiqueta}>Archivo</span>
                <Segmented variant="panel" ariaLabel="Archivo" options={opciones} value={tipo} onChange={setTipo} disabled={ocupado} />
            </div>
            {tipo === 'gif' ? (
                <div>
                    <span className={claseEtiqueta}>Duración de la vuelta</span>
                    <Segmented variant="panel" ariaLabel="Duración" options={DURACIONES} value={segundosGif} onChange={setSegundosGif} disabled={ocupado} />
                </div>
            ) : (
                <div>
                    <span className={claseEtiqueta}>Tamaño</span>
                    <Segmented variant="panel" ariaLabel="Tamaño" options={CALIDADES} value={calidad} onChange={setCalidad} disabled={ocupado} />
                </div>
            )}
            <div>
                <span className={claseEtiqueta}>Centro de la vuelta</span>
                <Segmented variant="panel" ariaLabel="Centro de la vuelta" options={CENTROS} value={centro} onChange={setCentro} disabled={ocupado} />
            </div>
            {ocupado ? (
                <PildoraGrabacionGiro enLinea />
            ) : (
                <button type="button" onClick={empezar} className={claseBoton}>
                    {centro === 'punto' ? 'Elegir el centro y grabar' : (!active ? 'Entrar a 3D y grabar' : (tipo === 'gif' ? 'Grabar GIF' : 'Grabar video'))}
                </button>
            )}
            {error && !ocupado && <p className="font-garet text-[12px] text-[#D6336C]">{error}</p>}
        </div>
    );
};

const PanelAnimacion = ({ titulo, totalCapas = 1, claseEtiqueta = ETIQUETA, claseBoton = BOTON, onListo }) => {
    const { presente } = useDron();
    const [elegido, setQue] = useState('vuelta');
    const que = presente ? elegido : 'vuelta';

    return (
        <div className="flex flex-col gap-3">
            <div>
                <span className={claseEtiqueta}>Qué animar</span>
                <Segmented variant="panel" ariaLabel="Qué animar" options={opcionesQue(presente)} value={que} onChange={setQue} />
            </div>
            {que === 'ruta'
                ? <AnimacionRuta claseBoton={claseBoton} onListo={onListo} />
                : <AnimacionVuelta titulo={titulo} totalCapas={totalCapas} claseEtiqueta={claseEtiqueta} claseBoton={claseBoton} onListo={onListo} />}
        </div>
    );
};

export default PanelAnimacion;
