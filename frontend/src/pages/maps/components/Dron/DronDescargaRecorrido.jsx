import { useState } from 'react';
import Segmented from '@components/Segmented';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { triggerDownload } from '@services/downloadService';
import { trackView3d } from '@services/analyticsService';
import { exportarRecorrido } from '@pages/maps/helpers/dron/exportarRecorrido';
import { grabarRecorrido } from '@pages/maps/helpers/grabacion/animarRecorrido';
import { puedeGrabarVideo } from '@pages/maps/helpers/grabacion/codificador';
import { nombreDeArchivo } from '@pages/maps/helpers/grabacion/planGiro';

const DURACIONES = [{ value: 3, label: '3 s' }, { value: 5, label: '5 s' }];
const opcionesFormato = conVideo => [
    { value: 'png', label: 'PNG', tooltip: 'Imagen del recorrido completo' },
    { value: 'video', label: 'Video', disabled: !conVideo, tooltip: conVideo ? 'La ruta se dibuja tramo a tramo' : 'Tu navegador no puede grabar video' },
    { value: 'gif', label: 'GIF', tooltip: 'Animación ligera en loop, cuadrada' },
];

const imagenDelRecorrido = async (datos, plantilla) => {
    try {
        return await exportarRecorrido({ ...datos, plantilla });
    } catch {
        return exportarRecorrido({ ...datos, plantilla: null });
    }
};

const DronDescargaRecorrido = ({ leerDatos, plantilla, kmh, onCerrar }) => {
    const [formato, setFormato] = useState('png');
    const [segundos, setSegundos] = useState(3);
    const [progreso, setProgreso] = useState(null);
    const [error, setError] = useState(null);
    const ocupado = progreso !== null;

    const descargar = async () => {
        const datos = leerDatos();
        if (!datos || ocupado) return;
        setError(null);
        setProgreso(0);
        const fecha = new Date().toISOString().slice(0, 10);
        try {
            if (formato === 'png') {
                const imagen = await imagenDelRecorrido(datos, plantilla);
                if (imagen) triggerDownload(imagen, `recorrido-dron-${fecha}.png`);
            } else {
                const { archivo, extension } = await grabarRecorrido({ tipo: formato, segundos, plantilla, datos, kmh, alAvanzar: setProgreso });
                triggerDownload(archivo, `${nombreDeArchivo('recorrido en dron')}${extension}`);
                trackView3d('grabar_recorrido', { formato, segundos });
            }
            onCerrar();
        } catch (fallo) {
            setError(fallo?.message || 'No se pudo descargar el recorrido.');
        } finally {
            setProgreso(null);
        }
    };

    return (
        <div className="absolute right-10 top-1.5 z-10 flex w-[248px] flex-col gap-2.5 rounded-[12px] bg-[#F9FBFF] p-3 shadow-[0_5px_20px_#1A26641A]" role="dialog" aria-label="Descargar el recorrido">
            <div className="flex items-center justify-between">
                <span className="font-garet text-[13px] font-bold text-[#5C2472]">Descargar recorrido</span>
                <MobileSheetCloseButton onClick={onCerrar} />
            </div>
            <Segmented variant="panel" ariaLabel="Formato" options={opcionesFormato(puedeGrabarVideo())} value={formato} onChange={setFormato} disabled={ocupado} />
            {formato !== 'png' && (
                <Segmented variant="panel" ariaLabel="Duración" options={DURACIONES} value={segundos} onChange={setSegundos} disabled={ocupado} />
            )}
            {ocupado && formato !== 'png' ? (
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0E6F6]" role="progressbar" aria-valuenow={Math.round(progreso * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[#FF8300] transition-[width] duration-200" style={{ width: `${Math.round(progreso * 100)}%` }} />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={descargar}
                    disabled={ocupado}
                    className="h-9 w-full rounded-[30px] bg-[#703089] font-garet text-[13px] font-bold text-white hover:bg-[#5C2472] cursor-pointer disabled:opacity-60"
                >
                    {ocupado ? 'Generando…' : `Descargar ${formato.toUpperCase()}`}
                </button>
            )}
            {error && <p className="font-garet text-[11.5px] text-[#D6336C]">{error}</p>}
        </div>
    );
};

export default DronDescargaRecorrido;
