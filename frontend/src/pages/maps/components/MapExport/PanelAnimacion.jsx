import { useState } from 'react';
import Segmented from '@components/Segmented';
import { useGrabarGiro } from '@hooksMaps/useGrabarGiro';
import { puedeGrabarVideo } from '@pages/maps/helpers/grabacion/codificador';

const ETIQUETA = 'block mb-1 font-garet text-[12px] font-bold text-[#465055]';
const BOTON = 'w-full h-12.5 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px] cursor-pointer';

const opcionesArchivo = conVideo => [
    { value: 'video', label: 'Video', disabled: !conVideo, tooltip: conVideo ? 'Una vuelta completa, hasta 30 s' : 'Tu navegador no puede grabar video' },
    { value: 'gif', label: 'GIF', tooltip: 'Animación ligera en loop, cuadrada' },
];
const DURACIONES = [{ value: 3, label: '3 s' }, { value: 5, label: '5 s' }];
const CALIDADES = [{ value: '720', label: '720p' }, { value: '1080', label: '1080p' }];

const PanelAnimacion = ({ titulo, totalCapas = 1, claseEtiqueta = ETIQUETA, claseBoton = BOTON }) => {
    const [conVideo] = useState(puedeGrabarVideo);
    const [tipo, setTipo] = useState(() => (puedeGrabarVideo() ? 'video' : 'gif'));
    const [segundosGif, setSegundosGif] = useState(3);
    const [calidad, setCalidad] = useState('720');
    const { grabando, progreso, error, grabar, cancelar } = useGrabarGiro();
    const porcentaje = Math.round((progreso || 0) * 100);

    return (
        <div className="flex flex-col gap-3">
            <div>
                <span className={claseEtiqueta}>Archivo</span>
                <Segmented variant="panel" ariaLabel="Archivo" options={opcionesArchivo(conVideo)} value={tipo} onChange={setTipo} disabled={grabando} />
            </div>
            {tipo === 'gif' ? (
                <div>
                    <span className={claseEtiqueta}>Duración de la vuelta</span>
                    <Segmented variant="panel" ariaLabel="Duración" options={DURACIONES} value={segundosGif} onChange={setSegundosGif} disabled={grabando} />
                </div>
            ) : (
                <div>
                    <span className={claseEtiqueta}>Tamaño</span>
                    <Segmented variant="panel" ariaLabel="Tamaño" options={CALIDADES} value={calidad} onChange={setCalidad} disabled={grabando} />
                </div>
            )}
            {grabando ? (
                <div className="flex flex-col gap-2" role="status" aria-live="polite">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0E6F6]">
                        <div className="h-full rounded-full bg-[#FF8300] transition-[width] duration-200" style={{ width: `${porcentaje}%` }} />
                    </div>
                    <div className="flex items-center justify-between font-garet text-[12px] text-[#465055]">
                        <span>Grabando la vuelta… {porcentaje} %</span>
                        <button type="button" onClick={cancelar} className="font-bold text-[#5C2472] underline cursor-pointer">Cancelar</button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => grabar({ tipo, segundosGif, calidad, titulo, totalCapas })} className={claseBoton}>
                    {tipo === 'gif' ? 'Grabar GIF' : 'Grabar video'}
                </button>
            )}
            {error && <p className="font-garet text-[12px] text-[#D6336C]">{error}</p>}
        </div>
    );
};

export default PanelAnimacion;
